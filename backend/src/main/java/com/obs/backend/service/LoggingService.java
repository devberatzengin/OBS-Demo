package com.obs.backend.service;

import com.obs.backend.model.SystemLog;
import java.util.List;

public interface LoggingService {
    void log(String action, String details, String performedBy, String entityType, String entityId);
    List<SystemLog> getRecentLogs();
}
