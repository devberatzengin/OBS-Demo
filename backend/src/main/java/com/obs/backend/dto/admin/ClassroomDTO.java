package com.obs.backend.dto.admin;

import jakarta.validation.constraints.*;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ClassroomDTO {
    private Long id;
    @NotBlank @Size(max = 50)
    private String code;
    @Positive
    private Integer capacity;
}
