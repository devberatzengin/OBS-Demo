package com.obs.backend.repository;

import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Page;
import com.obs.backend.model.Student;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface StudentRepository extends JpaRepository<Student, Long> {
    Optional<Student> findByStudentNumber(String studentNumber);
    Optional<Student> findByUsername(String username);
    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = "department")
    java.util.List<Student> findByAdvisorId(Long advisorId);
    boolean existsByStudentNumber(String studentNumber);
    long countByDepartmentId(Long departmentId);
    long countByDepartmentFacultyId(Long facultyId);

    /**
     * Admin list (plan 4.2): name, username, email or number contains the term;
     * {@code anyDepartment} true ignores {@code departmentId}.
     */
    @Query(value = """
            select x from Student x left join fetch x.department d
            where (:anyDepartment = true or d.id = :departmentId)
              and (lower(concat(x.firstName, ' ', x.lastName)) like :q escape '\\'
                or lower(x.username) like :q escape '\\' or lower(x.email) like :q escape '\\'
                or lower(x.studentNumber) like :q escape '\\')""",
            countQuery = """
            select count(x) from Student x left join x.department d
            where (:anyDepartment = true or d.id = :departmentId)
              and (lower(concat(x.firstName, ' ', x.lastName)) like :q escape '\\'
                or lower(x.username) like :q escape '\\' or lower(x.email) like :q escape '\\'
                or lower(x.studentNumber) like :q escape '\\')""")
    Page<Student> search(@Param("q") String q, @Param("anyDepartment") boolean anyDepartment,
                         @Param("departmentId") Long departmentId, Pageable pageable);

    /** Students per department in one query: [departmentId, count]. */
    @Query("select x.department.id, count(x) from Student x where x.department is not null group by x.department.id")
    java.util.List<Object[]> countPerDepartment();
}
