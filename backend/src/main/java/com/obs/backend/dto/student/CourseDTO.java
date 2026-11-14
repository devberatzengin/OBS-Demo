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
    /** Passed with a letter that may not be raised; registration is closed for it. */
    private boolean passed;
    /** Null when the course has no quota. */
    private Integer quota;
    /** Places taken this semester (pending and approved); null when the course has no quota. */
    private Long enrolledCount;
    private String status;
}
