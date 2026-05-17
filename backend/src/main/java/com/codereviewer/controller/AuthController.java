package com.codereviewer.controller;

import com.codereviewer.dto.AuthRequest;
import com.codereviewer.dto.AuthResponse;
import com.codereviewer.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    /**
     * POST /api/auth/register — Create a new user account.
     */
    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody AuthRequest request) {
        AuthResponse response = authService.register(request);
        return ResponseEntity.ok(response);
    }

    /**
     * POST /api/auth/login — Login and receive JWT token.
     */
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody AuthRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(response);
    }

    /**
     * POST /api/auth/refresh — Refresh an expired JWT token.
     */
    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refresh(@RequestBody Map<String, String> request) {
        String refreshToken = request.get("refreshToken");
        if (refreshToken == null || refreshToken.isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        AuthResponse response = authService.refreshToken(refreshToken);
        return ResponseEntity.ok(response);
    }

    /**
     * POST /api/auth/google — Handle Google OAuth token exchange.
     * The frontend sends the Google ID token data after Google login.
     */
    @PostMapping("/google")
    public ResponseEntity<AuthResponse> googleAuth(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        String name = request.get("name");
        String picture = request.get("picture");

        if (email == null || email.isBlank()) {
            return ResponseEntity.badRequest().build();
        }

        AuthResponse response = authService.handleGoogleOAuth(email, name, picture);
        return ResponseEntity.ok(response);
    }
}
