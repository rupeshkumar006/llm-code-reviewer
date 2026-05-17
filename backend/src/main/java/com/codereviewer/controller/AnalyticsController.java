package com.codereviewer.controller;

import com.codereviewer.dto.AnalyticsResponse;
import com.codereviewer.service.AnalyticsService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/analytics")
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    public AnalyticsController(AnalyticsService analyticsService) {
        this.analyticsService = analyticsService;
    }

    /**
     * GET /api/analytics/summary — User stats, score trends, and bug distribution.
     */
    @GetMapping("/summary")
    public ResponseEntity<AnalyticsResponse> getAnalytics(Authentication authentication) {
        AnalyticsResponse response = analyticsService.getAnalytics(authentication.getName());
        return ResponseEntity.ok(response);
    }
}
