package com.obs.backend.repository;

import com.obs.backend.model.Course;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CourseRepository extends JpaRepository<Course, Long> {
    List<Course> findByDepartmentId(Long departmentId);
    List<Course> findByInstructorId(Long instructorId);
    java.util.Optional<Course> findByCode(String code);
    long countByDepartmentId(Long departmentId);
    long countByDepartmentFacultyId(Long facultyId);

    /**
     * Loads the courses with a row lock (SELECT ... FOR UPDATE) for the rest of the transaction,
     * so quota checks of concurrent registrations run one after another (plan 3.2).
     * Ordered by id so two requests always lock in the same order and cannot deadlock.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select c from Course c where c.id in :ids order by c.id")
    List<Course> findAllByIdForUpdate(@Param("ids") java.util.Collection<Long> ids);
}
