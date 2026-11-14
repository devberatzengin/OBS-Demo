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
public class AdminCourseDTO {
    private Long id;
    @NotBlank @Size(max = 20)
    private String code;
    @NotBlank @Size(max = 255)
    private String name;
    @NotNull @Min(1) @Max(30)
    private Integer akts;
    @NotNull @PositiveOrZero
    private Integer credits;
    private Integer semesterLevel;
    @NotNull
    private Long departmentId;
    private String departmentName;
    private Long instructorId;
    private String instructorName;
}
