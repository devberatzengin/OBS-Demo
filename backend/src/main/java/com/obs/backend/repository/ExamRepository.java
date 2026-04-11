package com.obs.backend.repository;

import com.obs.backend.model.Exam;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ExamRepository extends JpaRepository<Exam, Long> {
    List<Exam> findByCourseId(Long courseId);
    List<Exam> findByCourseIdInAndSemesterId(List<Long> courseIds, Long semesterId);
}
