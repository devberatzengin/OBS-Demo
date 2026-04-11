package com.obs.backend.repository;

import com.obs.backend.model.Announcement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface AnnouncementRepository extends JpaRepository<Announcement, Long> {
    List<Announcement> findByCourseIdOrderByTimestampDesc(Long courseId);
}
