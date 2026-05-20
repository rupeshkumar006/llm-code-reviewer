package com.codereviewer.service;

import com.codereviewer.dto.ReviewResponse;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.*;

/**
 * AI Service — calls Google Gemini API using Java's built-in HttpClient.
 *
 * Uses java.net.http.HttpClient (not WebFlux/WebClient) so that .block()
 * restrictions never apply, regardless of which thread calls this service.
 * This is critical for SseEmitter background threads.
 *
 * Endpoint: POST https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key={KEY}
 */
@Service
public class AIService {

    private static final Logger log = LoggerFactory.getLogger(AIService.class);

    private static final String GEMINI_BASE    = "https://generativelanguage.googleapis.com";
    private static final String GENERATE_PATH  = "/v1beta/models/%s:generateContent?key=%s";
    private static final String DEFAULT_MODEL  = "gemini-3.1-flash-lite";

    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;
    private final String apiKey;
    private final String model;
    private final int maxTokens;

    public AIService(
            @Value("${app.gemini.api-key}") String apiKey,
            @Value("${app.gemini.model:gemini-3.1-flash-lite}") String model,
            @Value("${app.gemini.max-tokens:8192}") int maxTokens,
            ObjectMapper objectMapper) {
        this.apiKey = apiKey;
        this.model = (model == null || model.isBlank()) ? DEFAULT_MODEL : model;
        this.maxTokens = maxTokens;
        this.objectMapper = objectMapper;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(15))
                .build();
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  Prompt builder
    // ─────────────────────────────────────────────────────────────────────────

    private String buildPrompt(String language, String code) {
        return """
            You are an expert code reviewer specializing in %s. Analyze the following code thoroughly and respond ONLY with a valid JSON object (no markdown, no code fences, no explanation outside JSON).

            The JSON must have this exact structure:
            {
              "score": <number 0-100, overall code quality>,
              "bugs": [
                {
                  "line": <line number>,
                  "severity": "Critical|High|Medium|Low",
                  "description": "<what the bug is>",
                  "fix": "<how to fix it>"
                }
              ],
              "security": [
                {
                  "line": <line number>,
                  "severity": "Critical|High|Medium|Low",
                  "vulnerability": "<OWASP category or type>",
                  "description": "<what the vulnerability is>",
                  "fix": "<how to fix it>"
                }
              ],
              "complexity": {
                "score": <cyclomatic complexity estimate>,
                "warnings": ["<warning about complex methods, deep nesting, etc.>"]
              },
              "bestPractices": [
                "<specific best practice violation or recommendation>"
              ],
              "refactoredCode": "<the entire code rewritten with improvements applied>",
              "summary": "<2-3 sentence summary of the review>",
              "detectedLanguage": "<language detected from the code>",
              "languageMismatch": <true/false if detected language doesn't match selected language %s>
            }

            Scoring guide:
            - 90-100: Excellent, production-ready
            - 70-89: Good, minor issues
            - 40-69: Needs improvement
            - 0-39: Critical issues found

            Code to review:
            ```%s
            %s
            ```
            """.formatted(language, language, language, code);
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  Build the Gemini request body
    // ─────────────────────────────────────────────────────────────────────────

    private Map<String, Object> buildGeminiRequest(String prompt) {
        Map<String, Object> part = Map.of("text", prompt);
        Map<String, Object> content = Map.of("parts", List.of(part));
        Map<String, Object> generationConfig = new LinkedHashMap<>();
        generationConfig.put("maxOutputTokens", maxTokens);
        generationConfig.put("temperature", 0.2);
        generationConfig.put("responseMimeType", "application/json");

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("contents", List.of(content));
        body.put("generationConfig", generationConfig);
        return body;
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  Core HTTP call — works on ANY thread (no reactor restrictions)
    // ─────────────────────────────────────────────────────────────────────────

    private String callGeminiApi(String requestBodyJson) throws Exception {
        List<String> modelsToTry = new ArrayList<>();
        modelsToTry.add(this.model);
        
        List<String> priorityList = List.of(
            "gemini-3.1-flash-lite",
            "gemini-2.5-flash-lite",
            "gemini-flash-latest",
            "gemini-2.5-flash"
        );
        
        for (String m : priorityList) {
            if (!m.equals(this.model)) {
                modelsToTry.add(m);
            }
        }

        Exception lastException = null;
        
        for (String targetModel : modelsToTry) {
            int maxAttempts = 3;
            long backoffMs = 1000;
            
            for (int attempt = 1; attempt <= maxAttempts; attempt++) {
                try {
                    log.info("Attempting Gemini API call with model: {} (attempt {}/{})", targetModel, attempt, maxAttempts);
                    return executeApiCall(requestBodyJson, targetModel);
                } catch (Exception e) {
                    lastException = e;
                    log.warn("Gemini API call failed for model {} on attempt {}/{}: {}", 
                             targetModel, attempt, maxAttempts, e.getMessage());
                    
                    // If it's a client error (e.g. 400 Bad Request, 401 Unauthorized, 403 Forbidden), 
                    // or a safety block, retrying won't help. Propagate the error immediately.
                    if (e.getMessage() != null && (
                            e.getMessage().contains("HTTP 400") || 
                            e.getMessage().contains("HTTP 401") || 
                            e.getMessage().contains("HTTP 403") ||
                            e.getMessage().contains("SAFETY")
                       )) {
                        throw e;
                    }

                    // If it's a model-specific issue (404 Not Found, 429 Rate Limit/Quota, 503 Service Unavailable),
                    // retrying this same model immediately won't help. Skip retries and proceed to the next fallback.
                    if (e.getMessage() != null && (
                            e.getMessage().contains("HTTP 404") || 
                            e.getMessage().contains("HTTP 429") ||
                            e.getMessage().contains("HTTP 503")
                       )) {
                        log.warn("Model-specific issue encountered ({}). Skipping remaining retries for {} and trying next fallback.", 
                                 e.getMessage(), targetModel);
                        break;
                    }

                    if (attempt < maxAttempts) {
                        try {
                            Thread.sleep(backoffMs * attempt);
                        } catch (InterruptedException ie) {
                            Thread.currentThread().interrupt();
                            throw ie;
                        }
                    }
                }
            }
            log.warn("Model {} exhausted all attempts. Trying next fallback if available.", targetModel);
        }

        if (lastException != null) {
            throw lastException;
        }
        throw new RuntimeException("Unknown Gemini API error");
    }

    private String executeApiCall(String requestBodyJson, String targetModel) throws Exception {
        String url = GEMINI_BASE + String.format(GENERATE_PATH, targetModel, apiKey);

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .header("Content-Type", "application/json")
                .header("Accept", "application/json")
                .timeout(Duration.ofSeconds(90))
                .POST(HttpRequest.BodyPublishers.ofString(requestBodyJson))
                .build();

        HttpResponse<String> response = httpClient.send(
                request, HttpResponse.BodyHandlers.ofString());

        if (response.statusCode() != 200) {
            log.error("Gemini API returned HTTP {}: {}", response.statusCode(), response.body());
            throw new RuntimeException("Gemini API error HTTP " + response.statusCode()
                    + ": " + response.body());
        }

        return response.body();
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  Synchronous review (used by POST /api/review)
    // ─────────────────────────────────────────────────────────────────────────

    public ReviewResponse reviewCode(String language, String code) {
        String prompt = buildPrompt(language, code);
        Map<String, Object> requestBody = buildGeminiRequest(prompt);

        try {
            String requestJson = objectMapper.writeValueAsString(requestBody);
            String responseBody = callGeminiApi(requestJson);
            return parseGeminiResponse(responseBody);
        } catch (Exception e) {
            log.error("Gemini API call failed", e);
            return buildErrorResponse("AI review failed: " + e.getMessage());
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  SSE streaming review (used by POST /api/review/stream)
    //
    //  Emits:  status → result  (or status → error on failure)
    //  The Gemini call is blocking but runs on a background thread
    //  spawned by ReviewService, so no reactor restrictions apply.
    // ─────────────────────────────────────────────────────────────────────────

    public void streamReviewCode(String language, String code, SseEmitter emitter,
                                  Long userId,
                                  com.codereviewer.dto.ReviewRequest request,
                                  ReviewService reviewService) {
        try {
            // 1. Send immediate status so UI shows spinner
            emitter.send(SseEmitter.event()
                    .name("status")
                    .data("{\"status\":\"analyzing\",\"message\":\"CodeReviewer is reviewing your code...\"}"));

            // 2. Build and send request to Gemini
            String prompt = buildPrompt(language, code);
            Map<String, Object> requestBody = buildGeminiRequest(prompt);
            String requestJson = objectMapper.writeValueAsString(requestBody);
            String responseBody = callGeminiApi(requestJson);

            // 3. Parse result and save to DB (if authenticated)
            ReviewResponse result = parseGeminiResponse(responseBody);
            
            if (userId != null) {
                com.codereviewer.model.Review saved = reviewService.saveReviewPublic(userId, request, result);
                result.setId(saved.getId());
                result.setCreatedAt(saved.getCreatedAt().toString());
            } else {
                // Guest mode: no ID, set current time as createdAt
                result.setCreatedAt(java.time.LocalDateTime.now().toString());
            }
            result.setLanguage(language);

            // 4. Emit the full result
            String resultJson = objectMapper.writeValueAsString(result);
            emitter.send(SseEmitter.event()
                    .name("result")
                    .data(java.util.Objects.requireNonNull(resultJson, "resultJson cannot be null")));
            emitter.complete();

        } catch (Exception e) {
            log.error("Gemini streaming review failed", e);
            try {
                emitter.send(SseEmitter.event()
                        .name("error")
                        .data("{\"error\":\"" + escapeJson(e.getMessage()) + "\"}"));
                emitter.complete();
            } catch (IOException ex) {
                log.error("Error sending SSE error event", ex);
                emitter.completeWithError(ex);
            }
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  Response parsers
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Parse the full Gemini generateContent response.
     * Shape: { candidates: [{ content: { parts: [{ text: "..." }] } }] }
     */
    private ReviewResponse parseGeminiResponse(String responseBody) {
        try {
            JsonNode root = objectMapper.readTree(responseBody);

            if (root.has("error")) {
                String msg = root.path("error").path("message").asText("Unknown Gemini error");
                log.error("Gemini API error: {}", msg);
                return buildErrorResponse("Gemini API error: " + msg);
            }

            JsonNode candidates = root.path("candidates");
            if (candidates.isArray() && candidates.size() > 0) {
                JsonNode firstCandidate = candidates.get(0);

                String finishReason = firstCandidate.path("finishReason").asText("");
                if ("SAFETY".equals(finishReason)) {
                    return buildErrorResponse("Content blocked by Gemini safety filters");
                }
                if ("MAX_TOKENS".equals(finishReason)) {
                    log.warn("Gemini response truncated due to MAX_TOKENS");
                }

                JsonNode parts = firstCandidate.path("content").path("parts");
                if (parts.isArray() && parts.size() > 0) {
                    String text = parts.get(0).path("text").asText();
                    if ("MAX_TOKENS".equals(finishReason)) {
                        return buildErrorResponse("AI response was too long and got truncated. Try reviewing a smaller snippet.");
                    }
                    return parseJsonToReviewResponse(text);
                }
            }

            return buildErrorResponse("No content in Gemini response");
        } catch (Exception e) {
            log.error("Error parsing Gemini response", e);
            return buildErrorResponse("Failed to parse AI response: " + e.getMessage());
        }
    }

    /**
     * Parse JSON text (from AI) into ReviewResponse,
     * stripping any accidental markdown fences.
     */
    private ReviewResponse parseJsonToReviewResponse(String jsonText) {
        try {
            String cleaned = jsonText.trim();
            
            // Try to find the first '{' and last '}' to extract JSON from surrounding text/markdown
            int firstBrace = cleaned.indexOf('{');
            int lastBrace = cleaned.lastIndexOf('}');
            
            if (firstBrace != -1 && lastBrace != -1 && lastBrace > firstBrace) {
                cleaned = cleaned.substring(firstBrace, lastBrace + 1);
            } else if (cleaned.startsWith("```")) {
                // Fallback to older fence cleaning if braces logic fails
                cleaned = cleaned.replaceAll("^```(?:json)?\\s*", "");
                cleaned = cleaned.replaceAll("\\s*```$", "");
                cleaned = cleaned.trim();
            }
            
            return objectMapper.readValue(cleaned, ReviewResponse.class);
        } catch (Exception e) {
            log.error("Error parsing review JSON: {}", jsonText, e);
            return buildErrorResponse("Failed to parse AI review JSON: " + e.getMessage());
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  Helpers
    // ─────────────────────────────────────────────────────────────────────────

    private ReviewResponse buildErrorResponse(String message) {
        return ReviewResponse.builder()
                .score(0)
                .bugs(Collections.emptyList())
                .security(Collections.emptyList())
                .complexity(ReviewResponse.Complexity.builder()
                        .score(0)
                        .warnings(Collections.emptyList())
                        .build())
                .bestPractices(Collections.emptyList())
                .refactoredCode("")
                .summary("Error: " + message)
                .detectedLanguage("unknown")
                .languageMismatch(false)
                .build();
    }

    private String escapeJson(String text) {
        if (text == null) return "";
        return text.replace("\\", "\\\\")
                   .replace("\"", "\\\"")
                   .replace("\n", "\\n")
                   .replace("\r", "\\r")
                   .replace("\t", "\\t");
    }
}
