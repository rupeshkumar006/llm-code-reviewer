package com.codereviewer.service;

import com.codereviewer.model.User;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.Objects;
import java.util.Set;

/**
 * Redis sliding window rate limiter.
 * Free tier: 10 reviews per hour per user.
 * Pro/Admin: unlimited.
 */
@Service
public class RateLimitService {

    private static final int FREE_TIER_LIMIT = 10;
    private static final Duration WINDOW_DURATION = Duration.ofHours(1);
    private static final String KEY_PREFIX = "rate_limit:review:";

    private final StringRedisTemplate redisTemplate;

    public RateLimitService(StringRedisTemplate redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    /**
     * Check if a user is allowed to submit a review.
     * @return true if allowed, false if rate limited
     */
    public boolean isAllowed(Long userId, User.Role role) {
        // Pro and Admin users have unlimited reviews
        if (role == User.Role.PRO || role == User.Role.ADMIN) {
            return true;
        }

        String key = KEY_PREFIX + userId;
        long now = Instant.now().toEpochMilli();
        long windowStart = now - WINDOW_DURATION.toMillis();

        try {
            // Remove expired entries outside the sliding window
            redisTemplate.opsForZSet().removeRangeByScore(key, 0, windowStart);

            // Count entries in the current window
            Long count = redisTemplate.opsForZSet().zCard(key);
            if (count != null && count >= FREE_TIER_LIMIT) {
                return false;
            }

            // Add the current request timestamp
            redisTemplate.opsForZSet().add(key, Objects.requireNonNull(String.valueOf(now)), now);
            redisTemplate.expire(key, Objects.requireNonNull(WINDOW_DURATION.plusMinutes(1)));

            return true;
        } catch (Exception e) {
            // If Redis is down, allow the request (fail open)
            return true;
        }
    }

    /**
     * Get the number of remaining reviews for the current hour.
     */
    public int getRemainingReviews(Long userId, User.Role role) {
        if (role == User.Role.PRO || role == User.Role.ADMIN) {
            return -1; // -1 means unlimited
        }

        String key = KEY_PREFIX + userId;
        long now = Instant.now().toEpochMilli();
        long windowStart = now - WINDOW_DURATION.toMillis();

        try {
            redisTemplate.opsForZSet().removeRangeByScore(key, 0, windowStart);
            Long count = redisTemplate.opsForZSet().zCard(key);
            return FREE_TIER_LIMIT - (count != null ? count.intValue() : 0);
        } catch (Exception e) {
            return FREE_TIER_LIMIT;
        }
    }

    /**
     * Get seconds until the next review slot opens up.
     */
    public long getRetryAfterSeconds(Long userId) {
        String key = KEY_PREFIX + userId;

        try {
            Set<String> oldest = redisTemplate.opsForZSet().range(key, 0, 0);
            if (oldest != null && !oldest.isEmpty()) {
                long oldestTimestamp = Long.parseLong(oldest.iterator().next());
                long retryAfter = (oldestTimestamp + WINDOW_DURATION.toMillis() - Instant.now().toEpochMilli()) / 1000;
                return Math.max(retryAfter, 0);
            }
        } catch (Exception e) {
            // ignore
        }
        return 0;
    }
}
