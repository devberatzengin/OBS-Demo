package com.obs.backend.exception;

import com.obs.backend.dto.error.ErrorResponse;
import org.junit.jupiter.api.Test;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.sql.SQLException;

import static org.assertj.core.api.Assertions.assertThat;

class GlobalExceptionHandlerTest {

    private final GlobalExceptionHandler handler = new GlobalExceptionHandler();

    @Test
    void unexpectedErrorsDoNotLeakTheExceptionMessage() {
        ResponseEntity<ErrorResponse> response =
                handler.handleGeneralException(new IllegalStateException("SELECT password FROM users WHERE id = 1"));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
        assertThat(response.getBody().getDescription()).doesNotContain("SELECT").doesNotContain("password");
        assertThat(response.getBody().getTraceId()).isNotBlank();
        assertThat(response.getBody().getDescription()).contains(response.getBody().getTraceId());
    }

    @Test
    void constraintViolationsBecomeConflictWithoutDetails() {
        DataIntegrityViolationException ex = new DataIntegrityViolationException("could not execute statement",
                new SQLException("duplicate key value violates unique constraint \"uk_users_email\""));

        ResponseEntity<ErrorResponse> response = handler.handleDataIntegrityViolation(ex);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(response.getBody().getErrorCode()).isEqualTo(ErrorCode.CONFLICT.getCode());
        assertThat(response.getBody().getDescription()).doesNotContain("uk_users_email");
    }
}
