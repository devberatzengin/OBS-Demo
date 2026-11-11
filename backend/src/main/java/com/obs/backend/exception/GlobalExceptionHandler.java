package com.obs.backend.exception;

import com.obs.backend.dto.error.ErrorResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authorization.AuthorizationDeniedException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import java.time.LocalDateTime;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ObsException.class)
    public ResponseEntity<ErrorResponse> handleObsException(ObsException ex) {
        HttpStatus status = switch (ex.getErrorCode()) {
            case RESOURCE_NOT_FOUND -> HttpStatus.NOT_FOUND;
            case AUTHENTICATION_FAILED -> HttpStatus.UNAUTHORIZED;
            case ACCESS_DENIED -> HttpStatus.FORBIDDEN;
            case ALREADY_EXISTS, BAD_REQUEST, VALIDATION_ERROR,
                 COURSE_NOT_OPEN, COURSE_NOT_IN_DEPARTMENT, COURSE_ALREADY_PASSED,
                 MANDATORY_COURSE_MISSING, AKTS_LIMIT_EXCEEDED, SCHEDULE_CONFLICT -> HttpStatus.BAD_REQUEST;
            case CONFLICT, REGISTRATION_CLOSED, ALREADY_REGISTERED, QUOTA_FULL -> HttpStatus.CONFLICT;
            default -> HttpStatus.INTERNAL_SERVER_ERROR;
        };
        log.warn("{} {}: {}", status.value(), ex.getErrorCode().getCode(), ex.getDescription());
        return build(status, ex.getErrorCode(), ex.getDescription(), null);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidationException(MethodArgumentNotValidException ex) {
        String description = ex.getBindingResult().getFieldErrors().stream()
                .map(error -> error.getField() + ": " + error.getDefaultMessage())
                .collect(Collectors.joining(", "));
        return build(HttpStatus.BAD_REQUEST, ErrorCode.VALIDATION_ERROR, description, null);
    }

    @ExceptionHandler({AccessDeniedException.class, AuthorizationDeniedException.class})
    public ResponseEntity<ErrorResponse> handleAccessDeniedException(Exception ex) {
        return build(HttpStatus.FORBIDDEN, ErrorCode.ACCESS_DENIED, "Access Denied: " + ex.getMessage(), null);
    }

    /** A database constraint rejected the change; never echo the constraint or SQL back to the client. */
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ErrorResponse> handleDataIntegrityViolation(DataIntegrityViolationException ex) {
        log.warn("409 data integrity violation: {}", ex.getMostSpecificCause().getMessage());
        return build(HttpStatus.CONFLICT, ErrorCode.CONFLICT, "The request conflicts with existing data.", null);
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ErrorResponse> handleUnreadableBody(HttpMessageNotReadableException ex) {
        return build(HttpStatus.BAD_REQUEST, ErrorCode.BAD_REQUEST, "Malformed or missing request body.", null);
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ErrorResponse> handleTypeMismatch(MethodArgumentTypeMismatchException ex) {
        return build(HttpStatus.BAD_REQUEST, ErrorCode.BAD_REQUEST, "Invalid value for parameter '" + ex.getName() + "'.", null);
    }

    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<ErrorResponse> handleNoResource(NoResourceFoundException ex) {
        return build(HttpStatus.NOT_FOUND, ErrorCode.RESOURCE_NOT_FOUND, "No endpoint " + ex.getResourcePath(), null);
    }

    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<ErrorResponse> handleMethodNotSupported(HttpRequestMethodNotSupportedException ex) {
        return build(HttpStatus.METHOD_NOT_ALLOWED, ErrorCode.METHOD_NOT_ALLOWED, "Method " + ex.getMethod() + " is not supported here.", null);
    }

    @ExceptionHandler(TooManyRequestsException.class)
    public ResponseEntity<ErrorResponse> handleTooManyRequests(TooManyRequestsException ex) {
        ResponseEntity<ErrorResponse> response = build(HttpStatus.TOO_MANY_REQUESTS, ErrorCode.TOO_MANY_REQUESTS, ex.getMessage(), null);
        return ResponseEntity.status(response.getStatusCode())
                .header(HttpHeaders.RETRY_AFTER, String.valueOf(ex.getRetryAfterSeconds()))
                .body(response.getBody());
    }

    /** Anything unexpected: log it in full under a trace id and return only that id. */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGeneralException(Exception ex) {
        String traceId = UUID.randomUUID().toString();
        log.error("Unhandled exception [traceId={}]", traceId, ex);
        return build(HttpStatus.INTERNAL_SERVER_ERROR, ErrorCode.INTERNAL_SERVER_ERROR,
                "An unexpected error occurred. Reference: " + traceId, traceId);
    }

    private static ResponseEntity<ErrorResponse> build(HttpStatus status, ErrorCode code, String description, String traceId) {
        ErrorResponse body = ErrorResponse.builder()
                .errorCode(code.getCode())
                .errorName(code.getName())
                .description(description)
                .timestamp(LocalDateTime.now())
                .traceId(traceId)
                .build();
        return new ResponseEntity<>(body, status);
    }
}
