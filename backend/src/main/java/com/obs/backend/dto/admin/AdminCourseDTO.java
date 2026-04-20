package com.obs.backend.dto.admin;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminCourseDTO {
    private Long id;
    private String code;
    private String name;
    private Integer akts;
    private Integer credits;
    private Integer semesterLevel;
    private Long departmentId;
    private String departmentName;
    private Long instructorId;
    private String instructorName;
}
