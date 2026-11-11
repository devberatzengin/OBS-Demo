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
    java.util.Optional<Enrollment> findByCourseIdAndStudentIdAndSemesterId(Long courseId, Long studentId, Long semesterId);
    List<Enrollment> findByCourseIdAndSemesterIdAndStatus(Long courseId, Long semesterId, EnrollmentStatus status);
    long countByCourseId(Long courseId);
    long countByCourseIdAndSemesterIdAndStatusNot(Long courseId, Long semesterId, EnrollmentStatus status);
    List<Enrollment> findByStudentAdvisorIdAndStatus(Long advisorId, EnrollmentStatus status);
    List<Enrollment> findByCourseIdAndStatus(Long courseId, EnrollmentStatus status);
    List<Enrollment> findByStudentIdAndStatus(Long studentId, EnrollmentStatus status);
    List<Enrollment> findByStudentIdAndSemesterIdAndStatus(Long studentId, Long semesterId, EnrollmentStatus status);
}
