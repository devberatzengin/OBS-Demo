package com.obs.backend.repository;

import com.obs.backend.model.Academician;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AcademicianRepository extends JpaRepository<Academician, Long> {
    Optional<Academician> findByStaffNumber(String staffNumber);
    Optional<Academician> findByUsername(String username);
    boolean existsByStaffNumber(String staffNumber);
    java.util.List<Academician> findByDepartmentId(Long departmentId);
    long countByDepartmentId(Long departmentId);
    long countByDepartmentFacultyId(Long facultyId);
}
