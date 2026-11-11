package com.obs.backend.dto.error;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.LocalDateTime;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ErrorResponse {
    private String errorCode;
    private String errorName;
    private String description;
    private LocalDateTime timestamp;
    /** Set for unexpected errors so a user report can be matched to the server log. */
    private String traceId;
    /** Field name to message, only for validation errors. */
    @JsonInclude(JsonInclude.Include.NON_NULL)
    private Map<String, String> fieldErrors;
}
