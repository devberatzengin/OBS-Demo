package com.obs.backend.security.ratelimit;

import com.obs.backend.exception.TooManyRequestsException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;

/**
 * Sliding-window limit on login attempts, per username and per client IP.
 * The IP limit is higher than the per-user one because a campus network shares addresses.
 * In memory on purpose: one backend instance; a shared store (Redis) would be needed when scaling out.
 */
@Component
public class LoginAttemptLimiter {

    private final int maxPerUser;
    private final int maxPerIp;
    private final Duration window;
    private final Clock clock;
    private final Map<String, Deque<Instant>> attempts = new HashMap<>();

    @Autowired
    public LoginAttemptLimiter(@Value("${obs.security.login.max-attempts-per-user:5}") int maxPerUser,
                               @Value("${obs.security.login.max-attempts-per-ip:20}") int maxPerIp,
                               @Value("${obs.security.login.window-seconds:60}") long windowSeconds) {
        this(maxPerUser, maxPerIp, Duration.ofSeconds(windowSeconds), Clock.systemUTC());
    }

    LoginAttemptLimiter(int maxPerUser, int maxPerIp, Duration window, Clock clock) {
        this.maxPerUser = maxPerUser;
        this.maxPerIp = maxPerIp;
        this.window = window;
        this.clock = clock;
    }

    /** Records a login attempt, or throws {@link TooManyRequestsException} if either limit is reached. */
    public synchronized void check(String clientIp, String username) {
        Instant now = clock.instant();
        String ipKey = "ip:" + clientIp;
        String userKey = userKey(username);
        long retryAfter = Math.max(secondsUntilFree(ipKey, maxPerIp, now), secondsUntilFree(userKey, maxPerUser, now));
        if (retryAfter > 0) {
            throw new TooManyRequestsException(retryAfter);
        }
        attempts.computeIfAbsent(ipKey, k -> new ArrayDeque<>()).addLast(now);
        attempts.computeIfAbsent(userKey, k -> new ArrayDeque<>()).addLast(now);
    }

    /** A successful login clears that username's failed attempts. */
    public synchronized void onSuccess(String username) {
        attempts.remove(userKey(username));
    }

    private long secondsUntilFree(String key, int max, Instant now) {
        Deque<Instant> queue = attempts.get(key);
        if (queue == null) {
            return 0;
        }
        while (!queue.isEmpty() && !queue.peekFirst().plus(window).isAfter(now)) {
            queue.pollFirst();
        }
        if (queue.isEmpty()) {
            attempts.remove(key);
            return 0;
        }
        if (queue.size() < max) {
            return 0;
        }
        long millis = Duration.between(now, queue.peekFirst().plus(window)).toMillis();
        return Math.max(1, (millis + 999) / 1000);
    }

    private static String userKey(String username) {
        return "user:" + (username == null ? "" : username.trim().toLowerCase(Locale.ROOT));
    }
}
