package com.obs.backend.service.impl;

import com.obs.backend.model.SystemLog;
import com.obs.backend.repository.SystemLogRepository;
import com.obs.backend.service.LoggingService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class LoggingServiceImpl implements LoggingService {

    private final SystemLogRepository logRepository;

    @Override
    @Transactional
    public void log(String action, String details, String performedBy, String entityType, String entityId) {
        SystemLog log = SystemLog.builder()
                .action(action)
                .details(details)
                .performedBy(performedBy)
                .entityType(entityType)
                .entityId(entityId)
                .timestamp(LocalDateTime.now())
                .build();
        logRepository.save(log);
    }

    @Override
    public com.obs.backend.dto.common.PageResponse<SystemLog> getLogs(int page, int size) {
        var pageable = org.springframework.data.domain.PageRequest.of(
                com.obs.backend.dto.common.PageResponse.safePage(page), com.obs.backend.dto.common.PageResponse.safeSize(size));
        return com.obs.backend.dto.common.PageResponse.of(logRepository.findAllByOrderByTimestampDescIdDesc(pageable), log -> log);
    }
}
