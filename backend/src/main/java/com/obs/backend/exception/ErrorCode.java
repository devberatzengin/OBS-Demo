package com.obs.backend.exception;

import lombok.Getter;

@Getter
public enum ErrorCode {
    INTERNAL_SERVER_ERROR("OBS-000", "Internal Server Error"),
    VALIDATION_ERROR("OBS-001", "Validation Error"),
    RESOURCE_NOT_FOUND("OBS-002", "Resource Not Found"),
    AUTHENTICATION_FAILED("OBS-003", "Authentication Failed"),
    ACCESS_DENIED("OBS-004", "Access Denied"),
    BAD_REQUEST("OBS-005", "Bad Request"),
    ALREADY_EXISTS("OBS-006", "Resource Already Exists"),
    CONFLICT("OBS-007", "Conflict"),
    METHOD_NOT_ALLOWED("OBS-008", "Method Not Allowed"),
    TOO_MANY_REQUESTS("OBS-009", "Too Many Requests");

    private final String code;
    private final String name;

    ErrorCode(String code, String name) {
        this.code = code;
        this.name = name;
    }
}
