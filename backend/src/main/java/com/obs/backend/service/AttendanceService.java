package com.obs.backend.service;

import com.obs.backend.dto.student.AttendanceDTO;

import java.util.List;

public interface AttendanceService {
    List<AttendanceDTO> getAttendanceReport(String username);
}
