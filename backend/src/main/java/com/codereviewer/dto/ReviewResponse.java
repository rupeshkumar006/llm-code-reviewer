package com.codereviewer.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.*;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties(ignoreUnknown = true)
public class ReviewResponse {

    private Long id;
    private Integer score;
    private List<Bug> bugs;
    private List<SecurityIssue> security;
    private Complexity complexity;
    private List<String> bestPractices;
    private String refactoredCode;
    private String summary;
    private String detectedLanguage;
    private Boolean languageMismatch;
    private String code;
    private String language;
    private String createdAt;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Bug {
        private Integer line;
        private String severity;  // Critical, High, Medium, Low
        private String description;
        private String fix;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class SecurityIssue {
        private Integer line;
        private String severity;
        private String vulnerability;
        private String description;
        private String fix;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Complexity {
        private Integer score;
        private List<String> warnings;
    }
}
