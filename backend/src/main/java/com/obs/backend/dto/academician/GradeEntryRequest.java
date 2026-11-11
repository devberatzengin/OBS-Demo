package com.obs.backend.dto.academician;

import jakarta.validation.Valid;

import jakarta.validation.constraints.*;

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
    @NotEmpty @Valid
    private List<StudentGradeDTO> grades;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class StudentGradeDTO {
        @NotNull
        private Long studentId;
        @NotNull @DecimalMin("0") @DecimalMax("100")
        private Double score;
    }
}
