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
public class SemesterDTO {
    private Long id;
    @NotBlank @Size(max = 255)
    private String name;
    private java.time.LocalDate startDate;
    private java.time.LocalDate endDate;
    private java.time.LocalDate examStartDate;
    private java.time.LocalDate examEndDate;
    private java.time.LocalDate makeupExamStartDate;
    private java.time.LocalDate makeupExamEndDate;
    private java.time.LocalDate registrationStartDate;
    private java.time.LocalDate registrationEndDate;
    @com.fasterxml.jackson.annotation.JsonProperty("isActive")
    private boolean isActive;
}
