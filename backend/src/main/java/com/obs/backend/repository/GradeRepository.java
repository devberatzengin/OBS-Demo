package com.obs.backend.repository;

import com.obs.backend.model.Grade;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface GradeRepository extends JpaRepository<Grade, Long> {
    List<Grade> findByEnrollmentId(Long enrollmentId);
    List<Grade> findByExamId(Long examId);
    void deleteByExamId(Long examId);
}
