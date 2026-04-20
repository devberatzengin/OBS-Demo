package com.obs.backend.dto.academician;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GradeEntryRequest {
    private List<StudentGradeDTO> grades;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class StudentGradeDTO {
        private Long studentId;
        private Double score;
    }
}
