package com.codereviewer.controller;

import com.codereviewer.dto.ReviewRequest;
import com.codereviewer.dto.ReviewResponse;
import com.codereviewer.model.User;
import com.codereviewer.service.ExportService;
import com.codereviewer.service.ReviewService;
import com.codereviewer.service.ShareService;
import com.codereviewer.repository.UserRepository;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.List;
import java.util.Map;
import java.util.Objects;

@RestController
@RequestMapping("/api/review")
public class ReviewController {

    private final ReviewService reviewService;
    private final ExportService exportService;
    private final ShareService shareService;
    private final UserRepository userRepository;

    public ReviewController(ReviewService reviewService,
                            ExportService exportService,
                            ShareService shareService,
                            UserRepository userRepository) {
        this.reviewService = reviewService;
        this.exportService = exportService;
        this.shareService = shareService;
        this.userRepository = userRepository;
    }

    /**
     * POST /api/review — Submit code for AI review (synchronous).
     */
    @PostMapping
    public ResponseEntity<?> submitReview(@Valid @RequestBody ReviewRequest request,
                                          Authentication authentication) {
        try {
            String email = (authentication != null) ? authentication.getName() : null;
            ReviewResponse response = reviewService.submitReview(email, request);
            return ResponseEntity.ok(response);
        } catch (ReviewService.RateLimitExceededException e) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                    .header("Retry-After", String.valueOf(e.getRetryAfterSeconds()))
                    .body(Map.of("error", e.getMessage(),
                                 "retryAfter", e.getRetryAfterSeconds()));
        }
    }

    /**
     * GET /api/review/{id} — Get a specific review by ID.
     */
    @GetMapping("/{id}")
    public ResponseEntity<ReviewResponse> getReview(@PathVariable Long id,
                                                     Authentication authentication) {
        ReviewResponse response = reviewService.getReview(id, authentication.getName());
        return ResponseEntity.ok(response);
    }

    /**
     * GET /api/review/history — Get all reviews for current user (with filters).
     */
    @GetMapping("/history")
    public ResponseEntity<List<Map<String, Object>>> getHistory(
            Authentication authentication,
            @RequestParam(required = false) String language,
            @RequestParam(required = false) Integer minScore,
            @RequestParam(required = false) Integer maxScore,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestParam(required = false) String keyword) {
        List<Map<String, Object>> history = reviewService.getHistory(
                authentication.getName(), language, minScore, maxScore,
                startDate, endDate, keyword);
        return ResponseEntity.ok(history);
    }

    /**
     * DELETE /api/review/{id} — Delete a saved review.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteReview(@PathVariable Long id,
                                              Authentication authentication) {
        reviewService.deleteReview(id, authentication.getName());
        return ResponseEntity.noContent().build();
    }

    /**
     * PATCH /api/review/{id} — Update review metadata (label, favourite, tags).
     */
    @PatchMapping("/{id}")
    public ResponseEntity<Void> updateReview(@PathVariable Long id,
                                              @RequestBody Map<String, Object> updates,
                                              Authentication authentication) {
        String label = (String) updates.get("label");
        Boolean favourite = updates.containsKey("favourite") ?
                (Boolean) updates.get("favourite") : null;
        @SuppressWarnings("unchecked")
        List<String> tags = updates.containsKey("tags") ?
                (List<String>) updates.get("tags") : null;

        reviewService.updateReview(id, authentication.getName(), label, favourite, tags);
        return ResponseEntity.ok().build();
    }

    /**
     * POST /api/review/stream — Stream AI review via SSE.
     */
    @PostMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter streamReview(@Valid @RequestBody ReviewRequest request,
                                    Authentication authentication) {
        try {
            String email = (authentication != null) ? authentication.getName() : null;
            return reviewService.streamReview(email, request);
        } catch (ReviewService.RateLimitExceededException e) {
            SseEmitter emitter = new SseEmitter();
            try {
                emitter.send(SseEmitter.event()
                        .name("error")
                        .data("{\"error\":\"Rate limit exceeded\",\"retryAfter\":" +
                              e.getRetryAfterSeconds() + "}"));
                emitter.complete();
            } catch (Exception ex) {
                emitter.completeWithError(ex);
            }
            return emitter;
        }
    }

    /**
     * POST /api/review/{id}/export — Export review as PDF or JSON.
     */
    @PostMapping("/{id}/export")
    public ResponseEntity<byte[]> exportReview(@PathVariable Long id,
                                                @RequestParam(defaultValue = "pdf") String format,
                                                Authentication authentication) {
        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));

        if ("json".equalsIgnoreCase(format)) {
            byte[] json = exportService.exportAsJson(id, user.getId());
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=review-" + id + ".json")
                    .contentType(Objects.requireNonNull(MediaType.APPLICATION_JSON))
                    .body(json);
        } else {
            byte[] pdf = exportService.exportAsPdf(id, user.getId());
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=review-" + id + ".pdf")
                    .contentType(Objects.requireNonNull(MediaType.APPLICATION_PDF))
                    .body(pdf);
        }
    }

    /**
     * POST /api/review/{id}/share — Generate shareable link.
     */
    @PostMapping("/{id}/share")
    public ResponseEntity<Map<String, Object>> shareReview(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, Integer> body,
            Authentication authentication) {
        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));

        Integer expiryDays = body != null ? body.get("expiryDays") : null;
        Map<String, Object> result = shareService.generateShareLink(id, user.getId(), expiryDays);
        return ResponseEntity.ok(result);
    }

    /**
     * GET /api/review/remaining — Get remaining reviews count.
     */
    @GetMapping("/remaining")
    public ResponseEntity<Map<String, Integer>> getRemainingReviews(Authentication authentication) {
        String email = (authentication != null) ? authentication.getName() : null;
        int remaining = reviewService.getRemainingReviews(email);
        return ResponseEntity.ok(Map.of("remaining", remaining));
    }
}
