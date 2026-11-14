package com.obs.backend.exception;

import lombok.Getter;

/** Thrown when a client exceeds a rate limit; mapped to 429 with a Retry-After header. */
@Getter
public class TooManyRequestsException extends RuntimeException {

    private final long retryAfterSeconds;

    public TooManyRequestsException(long retryAfterSeconds) {
        super("Too many attempts. Try again in " + retryAfterSeconds + " seconds.");
        this.retryAfterSeconds = retryAfterSeconds;
    }
}
