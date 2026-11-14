package com.obs.backend.repository;

import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.Query;
import com.obs.backend.model.AttendanceRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AttendanceRecordRepository extends JpaRepository<AttendanceRecord, Long> {
    List<AttendanceRecord> findByEnrollmentId(Long enrollmentId);

    /** Attendance per enrollment in one query: [enrollmentId, records, present]. */
    @Query("""
            select a.enrollment.id, count(a), sum(case when a.isPresent = true then 1 else 0 end)
            from AttendanceRecord a where a.enrollment.id in :enrollmentIds group by a.enrollment.id""")
    List<Object[]> countPerEnrollment(@Param("enrollmentIds") java.util.Collection<Long> enrollmentIds);
    List<AttendanceRecord> findByEnrollmentStudentId(Long studentId);
    List<AttendanceRecord> findByEnrollmentCourseIdAndAttendanceDate(Long courseId, java.time.LocalDate date);
}
