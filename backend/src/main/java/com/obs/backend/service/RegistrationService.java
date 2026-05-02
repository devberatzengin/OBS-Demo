package com.obs.backend.service;

import com.obs.backend.dto.registration.RegistrationRequest;
import com.obs.backend.dto.student.CourseDTO;

import java.util.List;

public interface RegistrationService {
    List<CourseDTO> getAvailableCourses(String username);
    void enrollCourses(String username, RegistrationRequest request);
    void registerCourse(String username, Long courseId);
}
