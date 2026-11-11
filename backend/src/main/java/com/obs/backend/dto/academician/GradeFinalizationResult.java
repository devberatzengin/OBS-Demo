package com.obs.backend.dto.academician;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GradeFinalizationResult {
    private String courseCode;
    private String semesterName;
    /** Number of enrollments that received their letter grade in this call. */
    private int finalizedCount;
}
