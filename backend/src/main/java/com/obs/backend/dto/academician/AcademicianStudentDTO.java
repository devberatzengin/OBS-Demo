package com.obs.backend.dto.academician;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AcademicianStudentDTO {
    private Long id;
    private String studentNumber;
    private String firstName;
    private String lastName;
    private String departmentName;
    private Integer currentSemester;
    private Double gpa;
    private Double attendanceRate;
}
