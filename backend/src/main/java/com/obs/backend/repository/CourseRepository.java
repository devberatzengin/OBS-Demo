package com.obs.backend.repository;

import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Page;
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
    List<Course> findByInstructorIdAndOpenTrue(Long instructorId);
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

    /** Admin course catalogue (plan 4.2): code or name contains the term. */
    @Query(value = """
            select c from Course c left join fetch c.department d left join fetch c.instructor i
            where (:anyDepartment = true or d.id = :departmentId)
              and (lower(c.code) like :q escape '\\' or lower(c.name) like :q escape '\\')""",
            countQuery = """
            select count(c) from Course c left join c.department d
            where (:anyDepartment = true or d.id = :departmentId)
              and (lower(c.code) like :q escape '\\' or lower(c.name) like :q escape '\\')""")
    Page<Course> search(@Param("q") String q, @Param("anyDepartment") boolean anyDepartment,
                        @Param("departmentId") Long departmentId, Pageable pageable);

    /** Courses per department in one query: [departmentId, count]. */
    @Query("select c.department.id, count(c) from Course c where c.department is not null group by c.department.id")
    List<Object[]> countPerDepartment();

    long countByInstructorIsNull();
}
