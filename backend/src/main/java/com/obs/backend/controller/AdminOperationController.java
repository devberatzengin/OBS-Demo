package com.obs.backend.controller;

import jakarta.validation.Valid;

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
    public ResponseEntity<com.obs.backend.dto.common.PageResponse<com.obs.backend.model.SystemLog>> getLogs(
            @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(loggingService.getLogs(page, size));
    }

    @PostMapping("/announcement")
    public ResponseEntity<String> sendAnnouncement(@Valid @RequestBody AdminAnnouncementRequest request) {
        adminService.sendGlobalAnnouncement(request);
        return ResponseEntity.ok("Announcement sent to target users");
    }
}
