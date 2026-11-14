package com.obs.backend.repository;

import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Page;
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

    /** Admin list (plan 4.2), same search as students with the staff number. */
    @Query(value = """
            select x from Academician x left join fetch x.department d
            where (:anyDepartment = true or d.id = :departmentId)
              and (lower(concat(x.firstName, ' ', x.lastName)) like :q escape '\\'
                or lower(x.username) like :q escape '\\' or lower(x.email) like :q escape '\\'
                or lower(x.staffNumber) like :q escape '\\')""",
            countQuery = """
            select count(x) from Academician x left join x.department d
            where (:anyDepartment = true or d.id = :departmentId)
              and (lower(concat(x.firstName, ' ', x.lastName)) like :q escape '\\'
                or lower(x.username) like :q escape '\\' or lower(x.email) like :q escape '\\'
                or lower(x.staffNumber) like :q escape '\\')""")
    Page<Academician> search(@Param("q") String q, @Param("anyDepartment") boolean anyDepartment,
                             @Param("departmentId") Long departmentId, Pageable pageable);
}
