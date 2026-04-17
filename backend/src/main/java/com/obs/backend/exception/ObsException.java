package com.obs.backend.exception;

import lombok.Getter;

@Getter
public class ObsException extends RuntimeException {
    private final ErrorCode errorCode;
    private final String description;

    public ObsException(ErrorCode errorCode, String description) {
        super(description);
        this.errorCode = errorCode;
        this.description = description;
    }
}
