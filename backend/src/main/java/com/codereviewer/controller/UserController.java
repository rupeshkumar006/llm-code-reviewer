package com.codereviewer.controller;

import com.codereviewer.model.User;
import com.codereviewer.service.AuthService;
import com.codereviewer.service.RateLimitService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/user")
public class UserController {

    private final AuthService authService;
    private final RateLimitService rateLimitService;

    public UserController(AuthService authService, RateLimitService rateLimitService) {
        this.authService = authService;
        this.rateLimitService = rateLimitService;
    }

    /**
     * GET /api/user/profile — Get current user details.
     */
    @GetMapping("/profile")
    public ResponseEntity<Map<String, Object>> getProfile(Authentication authentication) {
        User user = authService.getUserByEmail(authentication.getName());

        Map<String, Object> profile = new LinkedHashMap<>();
        profile.put("id", user.getId());
        profile.put("email", user.getEmail());
        profile.put("displayName", user.getDisplayName());
        profile.put("profilePicture", user.getProfilePicture());
        profile.put("role", user.getRole().name());
        profile.put("provider", user.getProvider().name());
        profile.put("createdAt", user.getCreatedAt().toString());
        profile.put("remainingReviews",
                rateLimitService.getRemainingReviews(user.getId(), user.getRole()));

        return ResponseEntity.ok(profile);
    }
}
