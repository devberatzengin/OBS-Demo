package com.obs.backend.dto.admin;

/** An academician in a picker: id, display name and department (plan 4.2). */
public record AcademicianOptionDTO(Long id, String name, Long departmentId) {
}
