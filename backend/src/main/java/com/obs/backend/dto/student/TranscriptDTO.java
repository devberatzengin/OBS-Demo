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
public class TranscriptDTO {
    private String studentName;
    private String studentNumber;
    private String departmentName;
    private List<SemesterTranscriptDTO> semesters;
    private Double cumulativeGpa;
}
