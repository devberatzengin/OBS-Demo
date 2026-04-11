package com.obs.backend.repository;

import com.obs.backend.model.Student;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface StudentRepository extends JpaRepository<Student, Long> {
    Optional<Student> findByStudentNumber(String studentNumber);
    Optional<Student> findByUsername(String username);
    java.util.List<Student> findByAdvisorId(Long advisorId);
    boolean existsByStudentNumber(String studentNumber);
    long countByDepartmentId(Long departmentId);
    long countByDepartmentFacultyId(Long facultyId);
}
