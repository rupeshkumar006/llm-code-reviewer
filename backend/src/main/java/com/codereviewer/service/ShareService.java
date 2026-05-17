package com.codereviewer.service;

import com.codereviewer.model.ShareLink;
import com.codereviewer.model.Review;
import com.codereviewer.repository.ReviewRepository;
import com.codereviewer.repository.ShareLinkRepository;
import com.codereviewer.dto.ReviewResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;

@Service
public class ShareService {

    private final ShareLinkRepository shareLinkRepository;
    private final ReviewRepository reviewRepository;
    private final ObjectMapper objectMapper;

    public ShareService(ShareLinkRepository shareLinkRepository,
                        ReviewRepository reviewRepository,
                        ObjectMapper objectMapper) {
        this.shareLinkRepository = shareLinkRepository;
        this.reviewRepository = reviewRepository;
        this.objectMapper = objectMapper;
    }

    /**
     * Generate a shareable link for a review.
     * @param expiryDays null for never, 7 or 30 for days
     */
    @Transactional
    public Map<String, Object> generateShareLink(Long reviewId, Long userId, Integer expiryDays) {
        Review review = reviewRepository.findById(Objects.requireNonNull(reviewId))
                .orElseThrow(() -> new RuntimeException("Review not found"));

        if (!review.getUserId().equals(Objects.requireNonNull(userId))) {
            throw new RuntimeException("Access denied");
        }

        // Check if a share link already exists
        ShareLink existing = shareLinkRepository.findByReviewId(reviewId).orElse(null);
        if (existing != null) {
            return Map.of(
                    "token", existing.getToken(),
                    "expiresAt", existing.getExpiresAt() != null ? existing.getExpiresAt().toString() : "never"
            );
        }

        String token = UUID.randomUUID().toString().replace("-", "").substring(0, 12);
        LocalDateTime expiresAt = expiryDays != null ?
                LocalDateTime.now().plusDays(expiryDays) : null;

        ShareLink shareLink = ShareLink.builder()
                .reviewId(reviewId)
                .token(token)
                .expiresAt(expiresAt)
                .build();

        shareLinkRepository.save(Objects.requireNonNull(shareLink));

        return Map.of(
                "token", token,
                "expiresAt", expiresAt != null ? expiresAt.toString() : "never"
        );
    }

    /**
     * Get a shared review by token (public, no auth required).
     */
    public Map<String, Object> getSharedReview(String token) {
        ShareLink shareLink = shareLinkRepository.findByToken(token)
                .orElseThrow(() -> new RuntimeException("Share link not found or expired"));

        // Check expiry
        if (shareLink.getExpiresAt() != null && shareLink.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Share link has expired");
        }

        Review review = reviewRepository.findById(Objects.requireNonNull(shareLink.getReviewId()))
                .orElseThrow(() -> new RuntimeException("Review not found"));

        try {
            ReviewResponse response = objectMapper.readValue(review.getReviewResult(), ReviewResponse.class);

            Map<String, Object> result = new java.util.LinkedHashMap<>();
            result.put("id", review.getId());
            result.put("language", review.getLanguage());
            result.put("code", review.getCode());
            result.put("score", review.getScore());
            result.put("review", response);
            result.put("createdAt", review.getCreatedAt().toString());
            return result;
        } catch (Exception e) {
            throw new RuntimeException("Failed to parse review data");
        }
    }
}
