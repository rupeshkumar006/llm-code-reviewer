package com.codereviewer.repository;

import com.codereviewer.model.Review;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {

    List<Review> findByUserIdOrderByCreatedAtDesc(Long userId);

    Page<Review> findByUserId(Long userId, Pageable pageable);

    List<Review> findByUserIdAndLanguageOrderByCreatedAtDesc(Long userId, String language);

    @Query("SELECT DISTINCT r FROM Review r LEFT JOIN FETCH r.tags WHERE r.userId = :userId " +
           "AND (:language IS NULL OR r.language = :language) " +
           "AND (:minScore IS NULL OR r.score >= :minScore) " +
           "AND (:maxScore IS NULL OR r.score <= :maxScore) " +
           "AND (:startDate IS NULL OR r.createdAt >= :startDate) " +
           "AND (:endDate IS NULL OR r.createdAt <= :endDate) " +
           "AND (:keyword IS NULL OR r.code LIKE CONCAT('%', :keyword, '%') OR r.label LIKE CONCAT('%', :keyword, '%')) " +
           "ORDER BY r.favourite DESC, r.createdAt DESC")
    List<Review> searchReviews(
            @Param("userId") Long userId,
            @Param("language") String language,
            @Param("minScore") Integer minScore,
            @Param("maxScore") Integer maxScore,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate,
            @Param("keyword") String keyword
    );

    // Analytics queries
    @Query("SELECT COUNT(r) FROM Review r WHERE r.userId = :userId")
    Long countByUserId(@Param("userId") Long userId);

    @Query("SELECT COUNT(r) FROM Review r WHERE r.userId = :userId AND r.createdAt >= :since")
    Long countByUserIdSince(@Param("userId") Long userId, @Param("since") LocalDateTime since);

    @Query("SELECT AVG(r.score) FROM Review r WHERE r.userId = :userId")
    Double averageScoreByUserId(@Param("userId") Long userId);

    @Query("SELECT r.language, COUNT(r) FROM Review r WHERE r.userId = :userId GROUP BY r.language ORDER BY COUNT(r) DESC")
    List<Object[]> languageDistribution(@Param("userId") Long userId);

    @Query("SELECT CAST(r.createdAt AS DATE), AVG(r.score), COUNT(r) FROM Review r " +
           "WHERE r.userId = :userId AND r.createdAt >= :since " +
           "GROUP BY CAST(r.createdAt AS DATE) ORDER BY CAST(r.createdAt AS DATE)")
    List<Object[]> scoreHistoryByDay(@Param("userId") Long userId, @Param("since") LocalDateTime since);

    @Query("SELECT DISTINCT CAST(r.createdAt AS DATE) FROM Review r WHERE r.userId = :userId ORDER BY CAST(r.createdAt AS DATE) DESC")
    List<java.sql.Date> distinctReviewDates(@Param("userId") Long userId);

    List<Review> findByUserIdAndFavouriteTrueOrderByCreatedAtDesc(Long userId);
}
