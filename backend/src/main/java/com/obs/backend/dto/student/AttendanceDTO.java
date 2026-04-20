package com.obs.backend.dto.student;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AttendanceDTO {
    private String courseCode;
    private String courseName;
    private int totalHours;
    private int presentHours;
    private int absentHours;
    private double attendancePercentage;
    private boolean isLimitExceeded;
}
