package com.obs.backend.dto.academician;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdviseePerformanceDTO {
    private Long studentId;
    private String studentNumber;
    private String firstName;
    private String lastName;
    private Double gpa;
    private boolean isAtRisk; // GPA < 2.0
    private String departmentName;
    private Integer currentSemester;
}
