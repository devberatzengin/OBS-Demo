package com.obs.backend.dto.student;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StudentDashboardDTO {
    private String fullName;
    private String studentNumber;
    private Double gpa;
    private String facultyName;
    private String departmentName;
    private String activeSemesterName;
    private Integer currentSemester;
    private String advisorName;
    private Long advisorId;
    private List<NotificationDTO> recentNotifications;
    private List<CourseDTO> currentCourses;
}
