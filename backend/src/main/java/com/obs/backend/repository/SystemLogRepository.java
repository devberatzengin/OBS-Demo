package com.obs.backend.repository;

import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Page;
import com.obs.backend.model.SystemLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SystemLogRepository extends JpaRepository<SystemLog, Long> {
    List<SystemLog> findTop10ByOrderByTimestampDesc();

    Page<SystemLog> findAllByOrderByTimestampDescIdDesc(Pageable pageable);
}
