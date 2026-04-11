package com.obs.backend.repository;

import com.obs.backend.model.OfficeHour;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface OfficeHourRepository extends JpaRepository<OfficeHour, Long> {
    List<OfficeHour> findByAcademicianIdOrderByDayOfWeekAscStartTimeAsc(Long academicianId);
}
