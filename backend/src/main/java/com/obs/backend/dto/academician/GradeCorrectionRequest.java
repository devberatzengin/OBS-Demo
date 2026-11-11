package com.obs.backend.dto.academician;

import jakarta.validation.constraints.*;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/** Changes one exam score after the course grades were finalized. The reason is kept in the audit log. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GradeCorrectionRequest {
    @NotNull
    private Long studentId;
    @NotNull @DecimalMin("0") @DecimalMax("100")
    private Double score;
    @NotBlank @Size(min = 10, max = 500)
    private String reason;
}
