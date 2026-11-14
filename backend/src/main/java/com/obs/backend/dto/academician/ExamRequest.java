package com.obs.backend.dto.academician;

import jakarta.validation.constraints.*;

import com.obs.backend.model.enums.ExamType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExamRequest {
    @NotNull
    private ExamType examType;
    @NotNull
    private LocalDateTime examDate;
    @NotNull @DecimalMin(value = "0", inclusive = false) @DecimalMax("100")
    private Double ratio;
    @NotNull
    private Long classroomId;
}
