package com.obs.backend.dto.student;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SemesterTranscriptDTO {
    private String semesterName;
    private List<CourseGradeDTO> courses;
    private Double semesterGpa; // ANO
    private boolean active;
}
