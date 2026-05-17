package com.codereviewer.dto;

import lombok.*;
import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AnalyticsResponse {

    private Long totalReviews;
    private Long totalReviewsThisMonth;
    private Double averageScore;
    private String mostReviewedLanguage;
    private String mostCommonBugType;
    private Integer streakDays;

    private List<ScoreDataPoint> scoreHistory;     // line chart data
    private Map<String, Long> bugDistribution;     // pie chart data
    private Map<String, Long> languageDistribution;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ScoreDataPoint {
        private String date;
        private Double averageScore;
        private Long reviewCount;
    }
}
