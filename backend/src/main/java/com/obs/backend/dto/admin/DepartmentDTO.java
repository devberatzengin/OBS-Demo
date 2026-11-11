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
public class DepartmentDTO {
    private Long id;
    @NotBlank @Size(max = 255)
    private String name;
    @NotNull
    private Long facultyId;
    private String facultyName;
}
