package com.obs.backend.service;

import com.obs.backend.model.SystemLog;
import java.util.List;

public interface LoggingService {
    void log(String action, String details, String performedBy, String entityType, String entityId);
    /** Newest first, one page at a time (plan 4.2). */
    com.obs.backend.dto.common.PageResponse<SystemLog> getLogs(int page, int size);
}
