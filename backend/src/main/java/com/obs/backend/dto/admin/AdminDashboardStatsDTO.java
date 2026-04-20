package com.obs.backend.dto.admin;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminDashboardStatsDTO {
    private long studentCount;
    private long academicianCount;
    private long departmentCount;
    private long facultyCount;
    private long courseCount;
    private long administrativeCount;
    private String activeSemesterName;
    private String unitName;
}
