package com.obs.backend.security.ratelimit;

import com.obs.backend.exception.TooManyRequestsException;
import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZoneOffset;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class LoginAttemptLimiterTest {

    /** A clock the test moves by hand. */
    private static final class TestClock extends Clock {
        private Instant now = Instant.parse("2026-11-11T10:00:00Z");

        void advance(Duration d) { now = now.plus(d); }
        @Override public Instant instant() { return now; }
        @Override public ZoneId getZone() { return ZoneOffset.UTC; }
        @Override public Clock withZone(ZoneId zone) { return this; }
    }

    private final TestClock clock = new TestClock();
    private final LoginAttemptLimiter limiter = new LoginAttemptLimiter(5, 20, Duration.ofSeconds(60), clock);

    private void attempts(int n, String ip, String user) {
        for (int i = 0; i < n; i++) {
            limiter.check(ip, user);
        }
    }

    @Test
    void sixthAttemptForTheSameUserWithinAMinuteIsRefused() {
        attempts(5, "1.1.1.1", "berat");

        assertThatThrownBy(() -> limiter.check("1.1.1.1", "berat"))
                .isInstanceOf(TooManyRequestsException.class)
                .satisfies(ex -> assertThat(((TooManyRequestsException) ex).getRetryAfterSeconds()).isBetween(1L, 60L));
    }

    @Test
    void usernameMatchingIsCaseInsensitiveAndAcrossIps() {
        attempts(5, "1.1.1.1", "Berat");

        assertThatThrownBy(() -> limiter.check("2.2.2.2", " berat "))
                .isInstanceOf(TooManyRequestsException.class);
    }

    @Test
    void attemptsExpireAfterTheWindow() {
        attempts(5, "1.1.1.1", "berat");
        clock.advance(Duration.ofSeconds(61));

        assertThatCode(() -> limiter.check("1.1.1.1", "berat")).doesNotThrowAnyException();
    }

    @Test
    void successfulLoginResetsTheUserCounter() {
        attempts(5, "1.1.1.1", "berat");
        limiter.onSuccess("berat");

        assertThatCode(() -> limiter.check("1.1.1.1", "berat")).doesNotThrowAnyException();
    }

    @Test
    void oneIpCannotSprayManyUsernames() {
        for (int i = 0; i < 20; i++) {
            limiter.check("9.9.9.9", "user" + i);
        }

        assertThatThrownBy(() -> limiter.check("9.9.9.9", "another-user"))
                .isInstanceOf(TooManyRequestsException.class);
    }
}
