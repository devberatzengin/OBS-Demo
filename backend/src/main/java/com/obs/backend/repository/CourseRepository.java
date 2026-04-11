package com.obs.backend.repository;

import com.obs.backend.model.Course;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CourseRepository extends JpaRepository<Course, Long> {
    List<Course> findByDepartmentId(Long departmentId);
    List<Course> findByInstructorId(Long instructorId);
    java.util.Optional<Course> findByCode(String code);
    long countByDepartmentId(Long departmentId);
    long countByDepartmentFacultyId(Long facultyId);
}
