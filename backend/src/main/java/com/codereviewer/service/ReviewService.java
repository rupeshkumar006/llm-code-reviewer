package com.codereviewer.service;

import com.codereviewer.dto.ReviewRequest;
import com.codereviewer.dto.ReviewResponse;
import com.codereviewer.model.Review;
import com.codereviewer.model.ReviewTag;
import com.codereviewer.model.User;
import com.codereviewer.repository.ReviewRepository;
import com.codereviewer.repository.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.stream.Collectors;

@Service
public class ReviewService {

    private static final Logger log = LoggerFactory.getLogger(ReviewService.class);

    private final ReviewRepository reviewRepository;
    private final UserRepository userRepository;
    private final AIService aiService;
    private final RateLimitService rateLimitService;
    private final ObjectMapper objectMapper;

    public ReviewService(ReviewRepository reviewRepository,
                         UserRepository userRepository,
                         AIService aiService,
                         RateLimitService rateLimitService,
                         ObjectMapper objectMapper) {
        this.reviewRepository = reviewRepository;
        this.userRepository = userRepository;
        this.aiService = aiService;
        this.rateLimitService = rateLimitService;
        this.objectMapper = objectMapper;
    }

    /**
     * Submit code for AI review (synchronous).
     */
    @Transactional
    public ReviewResponse submitReview(String email, ReviewRequest request) {
        if (email == null) {
            // Guest mode: stateless review
            ReviewResponse response = aiService.reviewCode(request.getLanguage(), request.getCode());
            response.setLanguage(request.getLanguage());
            response.setCreatedAt(LocalDateTime.now().toString());
            return response;
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Check rate limit
        if (!rateLimitService.isAllowed(user.getId(), user.getRole())) {
            long retryAfter = rateLimitService.getRetryAfterSeconds(user.getId());
            throw new RateLimitExceededException(retryAfter);
        }

        // Call AI service
        ReviewResponse response = aiService.reviewCode(request.getLanguage(), request.getCode());

        // Save review to database
        Review review = saveReview(user.getId(), request, response);
        response.setId(review.getId());
        response.setLanguage(request.getLanguage());
        response.setCreatedAt(review.getCreatedAt().toString());

        return response;
    }

    /**
     * Submit code for AI review (SSE streaming).
     */
    public SseEmitter streamReview(String email, ReviewRequest request) {
        if (email == null) {
            // Guest mode: stateless streaming review
            SseEmitter emitter = new SseEmitter(120_000L);
            emitter.onTimeout(emitter::complete);
            emitter.onError((ex) -> log.error("SSE emitter error for guest", ex));

            final String lang = request.getLanguage();
            final String code = request.getCode();

            CompletableFuture.runAsync(() -> {
                try { Thread.sleep(80); } catch (InterruptedException ie) { Thread.currentThread().interrupt(); }
                aiService.streamReviewCode(lang, code, emitter, null, request, this);
            });

            return emitter;
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!rateLimitService.isAllowed(user.getId(), user.getRole())) {
            long retryAfter = rateLimitService.getRetryAfterSeconds(user.getId());
            throw new RateLimitExceededException(retryAfter);
        }

        // 2-minute timeout — Gemini free tier can be slow under load
        SseEmitter emitter = new SseEmitter(120_000L);

        // Register lifecycle callbacks so the emitter is never left open
        emitter.onTimeout(() -> {
            log.warn("SSE emitter timed out for user {}", email);
            emitter.complete();
        });
        emitter.onError((ex) ->
            log.error("SSE emitter error for user {}", email, ex)
        );

        // Use CompletableFuture so the common ForkJoin pool manages the thread.
        // The small sleep lets Spring MVC commit the SSE headers before the
        // background thread writes the first event, avoiding ERR_EMPTY_RESPONSE.
        final String lang    = request.getLanguage();
        final String code    = request.getCode();
        final Long   userId  = user.getId();

        CompletableFuture.runAsync(() -> {
            try {
                // Give Spring MVC time to write "200 OK" + SSE headers
                Thread.sleep(80);
            } catch (InterruptedException ie) {
                Thread.currentThread().interrupt();
            }
            aiService.streamReviewCode(lang, code, emitter, userId, request, this);
        });

        return emitter;
    }

    /**
     * Get a specific review by ID.
     */
    @Transactional(readOnly = true)
    public ReviewResponse getReview(Long reviewId, String email) {
        Review review = reviewRepository.findById(java.util.Objects.requireNonNull(reviewId, "reviewId cannot be null"))
                .orElseThrow(() -> new RuntimeException("Review not found"));

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!review.getUserId().equals(user.getId())) {
            throw new RuntimeException("Access denied");
        }

        return parseReviewToResponse(review);
    }

    /**
     * Get review history for the current user with optional filters.
     */
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getHistory(String email, String language,
                                                  Integer minScore, Integer maxScore,
                                                  String startDate, String endDate,
                                                  String keyword) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        LocalDateTime start = startDate != null ? LocalDateTime.parse(startDate) : null;
        LocalDateTime end = endDate != null ? LocalDateTime.parse(endDate) : null;

        List<Review> reviews = reviewRepository.searchReviews(
                user.getId(), language, minScore, maxScore, start, end, keyword);

        return reviews.stream().map(r -> {
            Map<String, Object> item = new java.util.LinkedHashMap<>();
            item.put("id", r.getId());
            item.put("language", r.getLanguage());
            item.put("score", r.getScore());
            item.put("bugCount", r.getBugCount());
            item.put("label", r.getLabel());
            item.put("favourite", r.getFavourite());
            item.put("tags", r.getTags().stream().map(ReviewTag::getTag).collect(Collectors.toList()));
            item.put("codePreview", r.getCode().length() > 100 ?
                    r.getCode().substring(0, 100) + "..." : r.getCode());
            item.put("createdAt", r.getCreatedAt().toString());
            return item;
        }).collect(Collectors.toList());
    }

    /**
     * Delete a review.
     */
    @Transactional
    public void deleteReview(Long reviewId, String email) {
        Review review = reviewRepository.findById(java.util.Objects.requireNonNull(reviewId, "reviewId cannot be null"))
                .orElseThrow(() -> new RuntimeException("Review not found"));

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!review.getUserId().equals(user.getId())) {
            throw new RuntimeException("Access denied");
        }

        reviewRepository.delete(review);
    }

    /**
     * Update review metadata (label, favourite, tags).
     */
    @Transactional
    public void updateReview(Long reviewId, String email,
                             String label, Boolean favourite, List<String> tags) {
        Review review = reviewRepository.findById(java.util.Objects.requireNonNull(reviewId, "reviewId cannot be null"))
                .orElseThrow(() -> new RuntimeException("Review not found"));

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!review.getUserId().equals(user.getId())) {
            throw new RuntimeException("Access denied");
        }

        if (label != null) review.setLabel(label);
        if (favourite != null) review.setFavourite(favourite);
        if (tags != null) {
            review.getTags().clear();
            tags.forEach(tag -> review.getTags().add(
                    ReviewTag.builder().review(review).tag(tag).build()));
        }

        reviewRepository.save(review);
    }

    /**
     * Get remaining reviews count for rate limit display.
     */
    @Transactional(readOnly = true)
    public int getRemainingReviews(String email) {
        if (email == null) return 5; // Default for display only, guests are tracked in sessionStorage

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return rateLimitService.getRemainingReviews(user.getId(), user.getRole());
    }

    // --- Private helpers ---

    /**
     * Public entry point for saving a review — called from AIService after SSE streaming.
     */
    @Transactional
    public Review saveReviewPublic(Long userId, ReviewRequest request, ReviewResponse response) {
        return saveReview(userId, request, response);
    }

    private Review saveReview(Long userId, ReviewRequest request, ReviewResponse response) {
        try {
            Review review = Review.builder()
                    .userId(userId)
                    .language(request.getLanguage())
                    .code(request.getCode())
                    .reviewResult(objectMapper.writeValueAsString(response))
                    .score(response.getScore())
                    .bugCount(response.getBugs() != null ? response.getBugs().size() : 0)
                    .build();

            Review saved = reviewRepository.save(java.util.Objects.requireNonNull(review, "review cannot be null"));
            return java.util.Objects.requireNonNull(saved, "saved review cannot be null");
        } catch (Exception e) {
            log.error("Error saving review", e);
            throw new RuntimeException("Failed to save review");
        }
    }

    private ReviewResponse parseReviewToResponse(Review review) {
        try {
            ReviewResponse response = objectMapper.readValue(
                    review.getReviewResult(), ReviewResponse.class);
            response.setId(review.getId());
            response.setCode(review.getCode());
            response.setLanguage(review.getLanguage());
            response.setCreatedAt(review.getCreatedAt().toString());
            return response;
        } catch (Exception e) {
            log.error("Error parsing stored review", e);
            throw new RuntimeException("Failed to parse review data");
        }
    }

    // Custom exception for rate limiting
    public static class RateLimitExceededException extends RuntimeException {
        private final long retryAfterSeconds;

        public RateLimitExceededException(long retryAfterSeconds) {
            super("Rate limit exceeded. Try again in " + retryAfterSeconds + " seconds.");
            this.retryAfterSeconds = retryAfterSeconds;
        }

        public long getRetryAfterSeconds() {
            return retryAfterSeconds;
        }
    }
}
