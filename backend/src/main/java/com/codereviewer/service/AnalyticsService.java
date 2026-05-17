package com.codereviewer.service;

import com.codereviewer.dto.AnalyticsResponse;
import com.codereviewer.dto.ReviewResponse;
import com.codereviewer.model.Review;
import com.codereviewer.model.User;
import com.codereviewer.repository.ReviewRepository;
import com.codereviewer.repository.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.sql.Date;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AnalyticsService {

    private static final Logger log = LoggerFactory.getLogger(AnalyticsService.class);

    private final ReviewRepository reviewRepository;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;

    public AnalyticsService(ReviewRepository reviewRepository,
                            UserRepository userRepository,
                            ObjectMapper objectMapper) {
        this.reviewRepository = reviewRepository;
        this.userRepository = userRepository;
        this.objectMapper = objectMapper;
    }

    public AnalyticsResponse getAnalytics(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Long userId = user.getId();

        // Basic counts
        Long totalReviews = reviewRepository.countByUserId(userId);
        Long totalThisMonth = reviewRepository.countByUserIdSince(userId,
                LocalDateTime.now().withDayOfMonth(1).withHour(0).withMinute(0));
        Double avgScore = reviewRepository.averageScoreByUserId(userId);

        // Score history (last 365 days)
        List<Object[]> scoreHistory = reviewRepository.scoreHistoryByDay(userId,
                LocalDateTime.now().minusDays(365));
        List<AnalyticsResponse.ScoreDataPoint> scoreDataPoints = scoreHistory.stream()
                .map(row -> AnalyticsResponse.ScoreDataPoint.builder()
                        .date(row[0].toString())
                        .averageScore(row[1] != null ? ((Number) row[1]).doubleValue() : 0.0)
                        .reviewCount(row[2] != null ? ((Number) row[2]).longValue() : 0L)
                        .build())
                .collect(Collectors.toList());

        // Language distribution
        List<Object[]> langDist = reviewRepository.languageDistribution(userId);
        Map<String, Long> languageDistribution = new LinkedHashMap<>();
        String mostReviewedLanguage = "N/A";
        for (Object[] row : langDist) {
            languageDistribution.put((String) row[0], ((Number) row[1]).longValue());
            if (mostReviewedLanguage.equals("N/A")) {
                mostReviewedLanguage = (String) row[0];
            }
        }

        // Bug distribution — aggregate from stored reviews
        Map<String, Long> bugDistribution = computeBugDistribution(userId);

        // Most common bug type
        String mostCommonBugType = bugDistribution.entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey)
                .orElse("N/A");

        // Streak calculation
        int streak = calculateStreak(userId);

        return AnalyticsResponse.builder()
                .totalReviews(totalReviews)
                .totalReviewsThisMonth(totalThisMonth)
                .averageScore(avgScore != null ? Math.round(avgScore * 10.0) / 10.0 : 0.0)
                .mostReviewedLanguage(mostReviewedLanguage)
                .mostCommonBugType(mostCommonBugType)
                .streakDays(streak)
                .scoreHistory(scoreDataPoints)
                .bugDistribution(bugDistribution)
                .languageDistribution(languageDistribution)
                .build();
    }

    /**
     * Calculate consecutive days with at least one review (streak).
     */
    private int calculateStreak(Long userId) {
        List<Date> dates = reviewRepository.distinctReviewDates(userId);
        if (dates == null || dates.isEmpty()) return 0;

        int streak = 0;
        LocalDate expected = LocalDate.now();

        for (Date sqlDate : dates) {
            LocalDate reviewDate = sqlDate.toLocalDate();

            if (reviewDate.equals(expected)) {
                streak++;
                expected = expected.minusDays(1);
            } else if (reviewDate.equals(expected.minusDays(1))) {
                // Allow checking from yesterday if no review today yet
                if (streak == 0) {
                    streak = 1;
                    expected = reviewDate.minusDays(1);
                } else {
                    break;
                }
            } else {
                break;
            }
        }

        return streak;
    }

    /**
     * Aggregate bug type distribution from all user reviews.
     */
    private Map<String, Long> computeBugDistribution(Long userId) {
        Map<String, Long> distribution = new LinkedHashMap<>();
        distribution.put("Logic Errors", 0L);
        distribution.put("Security Issues", 0L);
        distribution.put("Style Issues", 0L);
        distribution.put("Complexity", 0L);

        List<Review> reviews = reviewRepository.findByUserIdOrderByCreatedAtDesc(userId);
        for (Review review : reviews) {
            try {
                if (review.getReviewResult() == null) continue;
                ReviewResponse response = objectMapper.readValue(
                        review.getReviewResult(), ReviewResponse.class);

                // Count bugs as logic errors
                if (response.getBugs() != null) {
                    distribution.merge("Logic Errors", (long) response.getBugs().size(), (a, b) -> a + b);
                }

                // Count security issues
                if (response.getSecurity() != null) {
                    distribution.merge("Security Issues", (long) response.getSecurity().size(), (a, b) -> a + b);
                }

                // Count best practice violations as style issues
                if (response.getBestPractices() != null) {
                    distribution.merge("Style Issues", (long) response.getBestPractices().size(), (a, b) -> a + b);
                }

                // Count complexity warnings
                if (response.getComplexity() != null && response.getComplexity().getWarnings() != null) {
                    distribution.merge("Complexity", (long) response.getComplexity().getWarnings().size(), (a, b) -> a + b);
                }
            } catch (Exception e) {
                log.warn("Failed to parse review {} for analytics", review.getId());
            }
        }

        return distribution;
    }
}
