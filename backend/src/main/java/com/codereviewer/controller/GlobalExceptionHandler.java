package com.codereviewer.controller;

import com.codereviewer.service.ReviewService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ReviewService.RateLimitExceededException.class)
    public ResponseEntity<Map<String, Object>> handleRateLimit(ReviewService.RateLimitExceededException ex) {
        Map<String, Object> body = new HashMap<>();
        body.put("error", "Rate limit exceeded");
        body.put("message", ex.getMessage());
        body.put("retryAfter", ex.getRetryAfterSeconds());
        return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                .header("Retry-After", String.valueOf(ex.getRetryAfterSeconds()))
                .body(body);
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<Map<String, String>> handleBadCredentials(BadCredentialsException ex) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("error", "Invalid email or password"));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidation(MethodArgumentNotValidException ex) {
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getAllErrors().forEach(error -> {
            String fieldName = ((FieldError) error).getField();
            String message = error.getDefaultMessage();
            errors.put(fieldName, message);
        });
        return ResponseEntity.badRequest().body(Map.of("errors", errors));
    }

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, String>> handleRuntime(RuntimeException ex) {
        HttpStatus status = HttpStatus.INTERNAL_SERVER_ERROR;
        String message = ex.getMessage() != null ? ex.getMessage() : "Internal server error";
        
        if (ex.getMessage() != null) {
            if (ex.getMessage().contains("not found")) status = HttpStatus.NOT_FOUND;
            if (ex.getMessage().contains("Access denied")) status = HttpStatus.FORBIDDEN;
            if (ex.getMessage().contains("already registered")) status = HttpStatus.CONFLICT;
        }
        return ResponseEntity.status(status).body(Map.of("error", message));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, String>> handleGeneric(Exception ex) {
        ex.printStackTrace(); // Log to server console
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Unhandled Exception: " + ex.getClass().getSimpleName() + ": " + ex.getMessage()));
    }
}
