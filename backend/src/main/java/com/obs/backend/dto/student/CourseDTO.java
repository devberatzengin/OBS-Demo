package com.obs.backend.dto.student;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CourseDTO {
    private Long id;
    private String code;
    private String name;
    private Integer akts;
    private Integer credits;
    private String instructorName;
    private String grade;
    private boolean registered;
    private boolean mandatory;
    private String status;
}
