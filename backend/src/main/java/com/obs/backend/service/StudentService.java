package com.obs.backend.service;

import com.obs.backend.dto.student.ExamDTO;
import com.obs.backend.dto.student.ScheduleDTO;
import com.obs.backend.dto.student.StudentDashboardDTO;
import com.obs.backend.dto.student.StudentProfileDTO;

import com.obs.backend.dto.user.UpdateProfileRequest;

import java.util.List;

public interface StudentService {
    StudentDashboardDTO getDashboardData(String username);
    StudentProfileDTO getProfileData(String username);
    void updateProfile(String username, UpdateProfileRequest request);
    List<ExamDTO> getExamCalendar(String username);
    List<ScheduleDTO> getWeeklySchedule(String username);
}
