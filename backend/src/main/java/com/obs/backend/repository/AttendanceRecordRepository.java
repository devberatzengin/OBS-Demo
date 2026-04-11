package com.obs.backend.repository;

import com.obs.backend.model.AttendanceRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AttendanceRecordRepository extends JpaRepository<AttendanceRecord, Long> {
    List<AttendanceRecord> findByEnrollmentId(Long enrollmentId);
    List<AttendanceRecord> findByEnrollmentStudentId(Long studentId);
    List<AttendanceRecord> findByEnrollmentCourseIdAndAttendanceDate(Long courseId, java.time.LocalDate date);
}
