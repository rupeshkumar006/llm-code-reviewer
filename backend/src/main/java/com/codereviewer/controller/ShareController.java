package com.codereviewer.controller;

import com.codereviewer.service.ShareService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/share")
public class ShareController {

    private final ShareService shareService;

    public ShareController(ShareService shareService) {
        this.shareService = shareService;
    }

    /**
     * GET /api/share/{token} — Public read-only link to a review.
     * No authentication required.
     */
    @GetMapping("/{token}")
    public ResponseEntity<Map<String, Object>> getSharedReview(@PathVariable String token) {
        Map<String, Object> review = shareService.getSharedReview(token);
        return ResponseEntity.ok(review);
    }
}
