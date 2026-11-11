package com.obs.backend.dto.academician;

import jakarta.validation.constraints.*;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CourseOpenRequest {
    @PositiveOrZero
    private Integer quota;
}
