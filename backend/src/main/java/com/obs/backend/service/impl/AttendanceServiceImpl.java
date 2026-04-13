package com.obs.backend.service.impl;

import com.obs.backend.dto.student.AttendanceDTO;
import com.obs.backend.exception.ErrorCode;
import com.obs.backend.exception.ObsException;
import com.obs.backend.model.AttendanceRecord;
import com.obs.backend.model.Enrollment;
import com.obs.backend.model.Semester;
import com.obs.backend.model.Student;
import com.obs.backend.repository.AttendanceRecordRepository;
import com.obs.backend.repository.EnrollmentRepository;
import com.obs.backend.repository.SemesterRepository;
import com.obs.backend.repository.StudentRepository;
import com.obs.backend.service.AttendanceService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AttendanceServiceImpl implements AttendanceService {

    private final StudentRepository studentRepository;
    private final SemesterRepository semesterRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final AttendanceRecordRepository attendanceRecordRepository;

    @Override
    public List<AttendanceDTO> getAttendanceReport(String username) {
        Student student = studentRepository.findByUsername(username)
                .orElseThrow(() -> new ObsException(ErrorCode.RESOURCE_NOT_FOUND, "Student not found"));

        Semester activeSemester = semesterRepository.findByIsActiveTrue()
                .orElse(null);

        if (activeSemester == null) return new ArrayList<>();

        @lombok.NonNull Long studentId = student.getId();
        @lombok.NonNull Long semId = activeSemester.getId();
        List<Enrollment> currentEnrollments = enrollmentRepository.findByStudentIdAndSemesterId(studentId, semId);

        return currentEnrollments.stream()
                .map(e -> {
                    @lombok.NonNull Long enrollId = e.getId();
                    List<AttendanceRecord> records = attendanceRecordRepository.findByEnrollmentId(enrollId);
                    int total = records.size();
                    int present = (int) records.stream().filter(AttendanceRecord::isPresent).count();
                    int absent = total - present;
                    double percentage = total > 0 ? (double) present / total * 100 : 100.0;
                    
                    return AttendanceDTO.builder()
                            .courseCode(e.getCourse().getCode())
                            .courseName(e.getCourse().getName())
                            .totalHours(total)
                            .presentHours(present)
                            .absentHours(absent)
                            .attendancePercentage(percentage)
                            .isLimitExceeded(total > 0 && percentage < 70.0) // 70% threshold
                            .build();
                })
                .collect(Collectors.toList());
    }
}
