package com.obs.backend.repository;

import com.obs.backend.model.Schedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ScheduleRepository extends JpaRepository<Schedule, Long> {
    List<Schedule> findByCourseIdIn(List<Long> courseIds);
    List<Schedule> findByCourseInstructorId(Long instructorId);
    List<Schedule> findByCourseId(Long courseId);
}
