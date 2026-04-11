package com.obs.backend.repository;

import com.obs.backend.model.Enrollment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.obs.backend.model.enums.EnrollmentStatus;
import java.util.List;

@Repository
public interface EnrollmentRepository extends JpaRepository<Enrollment, Long> {
    List<Enrollment> findByStudentIdAndSemesterId(Long studentId, Long semesterId);
    List<Enrollment> findByStudentId(Long studentId);
    List<Enrollment> findByCourseId(Long courseId);
    java.util.Optional<Enrollment> findByCourseIdAndStudentId(Long courseId, Long studentId);
    long countByCourseId(Long courseId);
    List<Enrollment> findByStudentAdvisorIdAndStatus(Long advisorId, EnrollmentStatus status);
    List<Enrollment> findByCourseIdAndStatus(Long courseId, EnrollmentStatus status);
    List<Enrollment> findByStudentIdAndStatus(Long studentId, EnrollmentStatus status);
    List<Enrollment> findByStudentIdAndSemesterIdAndStatus(Long studentId, Long semesterId, EnrollmentStatus status);
}
