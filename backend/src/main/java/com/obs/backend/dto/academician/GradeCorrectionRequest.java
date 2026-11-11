package com.obs.backend.dto.academician;

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
    private Long studentId;
    private Double score;
    private String reason;
}
