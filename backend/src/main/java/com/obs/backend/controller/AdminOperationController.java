package com.obs.backend.controller;

import com.obs.backend.dto.admin.AdminAnnouncementRequest;
import com.obs.backend.dto.admin.AdminDashboardStatsDTO;
import com.obs.backend.service.AdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/operations")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'ADMINISTRATIVE')")
public class AdminOperationController {

    private final AdminService adminService;
    private final com.obs.backend.service.LoggingService loggingService;

    @GetMapping("/stats")
    public ResponseEntity<AdminDashboardStatsDTO> getSystemStats(java.security.Principal principal) {
        return ResponseEntity.ok(adminService.getSystemStats(principal.getName()));
    }

    @GetMapping("/logs")
    public ResponseEntity<java.util.List<com.obs.backend.model.SystemLog>> getRecentLogs() {
        return ResponseEntity.ok(loggingService.getRecentLogs());
    }

    @PostMapping("/announcement")
    public ResponseEntity<String> sendAnnouncement(@RequestBody AdminAnnouncementRequest request) {
        adminService.sendGlobalAnnouncement(request);
        return ResponseEntity.ok("Announcement sent to target users");
    }
}
