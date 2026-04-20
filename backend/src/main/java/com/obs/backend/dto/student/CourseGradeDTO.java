package com.obs.backend.dto.student;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CourseGradeDTO {
    private String courseCode;
    private String courseName;
    private Integer credits;
    private Integer akts;
    private String grade; // AA, BA, etc.
}
