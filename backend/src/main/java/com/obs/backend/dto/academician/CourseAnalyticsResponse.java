package com.obs.backend.dto.academician;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CourseAnalyticsResponse {
    private Double averageScore;
    private Double minScore;
    private Double maxScore;
    private Long totalStudents;
    private Long passedStudents;
    private Double passRate; // e.g., 85.0 (percentage)
}
