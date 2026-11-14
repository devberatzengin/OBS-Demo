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
    TOO_MANY_REQUESTS("OBS-009", "Too Many Requests"),

    // Course registration rules (plan 3.1); one code per rule so the client can tell them apart
    REGISTRATION_CLOSED("OBS-101", "Registration Closed"),
    COURSE_NOT_OPEN("OBS-102", "Course Not Open"),
    COURSE_NOT_IN_DEPARTMENT("OBS-103", "Course Not In Department"),
    ALREADY_REGISTERED("OBS-104", "Already Registered"),
    COURSE_ALREADY_PASSED("OBS-105", "Course Already Passed"),
    MANDATORY_COURSE_MISSING("OBS-106", "Mandatory Course Missing"),
    AKTS_LIMIT_EXCEEDED("OBS-107", "AKTS Limit Exceeded"),
    SCHEDULE_CONFLICT("OBS-108", "Schedule Conflict"),
    QUOTA_FULL("OBS-109", "Quota Full");

    private final String code;
    private final String name;

    ErrorCode(String code, String name) {
        this.code = code;
        this.name = name;
    }
}
