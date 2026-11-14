package com.obs.backend.controller;

import com.obs.backend.dto.common.PageResponse;
import com.obs.backend.dto.admin.AcademicianOptionDTO;
import jakarta.validation.Valid;

import com.obs.backend.dto.admin.AdminAcademicianRegisterRequest;
import com.obs.backend.dto.admin.AdminAdministrativeRegisterRequest;
import com.obs.backend.dto.admin.AdminStudentRegisterRequest;
import com.obs.backend.service.AdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
// Staff (ADMINISTRATIVE) manage students and academicians; staff/admin accounts and deactivation are ADMIN-only.
@PreAuthorize("hasAnyRole('ADMIN', 'ADMINISTRATIVE')")
public class AdminUserController {

    private final AdminService adminService;

    @PostMapping("/students")
    public ResponseEntity<String> registerStudent(@Valid @RequestBody AdminStudentRegisterRequest request) {
        adminService.registerStudent(request);
        return ResponseEntity.ok("Student registered successfully");
    }

    @PostMapping("/academicians")
    public ResponseEntity<String> registerAcademician(@Valid @RequestBody AdminAcademicianRegisterRequest request) {
        adminService.registerAcademician(request);
        return ResponseEntity.ok("Academician registered successfully");
    }

    @PostMapping("/administrative")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<String> registerAdministrative(@Valid @RequestBody com.obs.backend.dto.admin.AdminAdministrativeRegisterRequest request) {
        adminService.registerAdministrative(request);
        return ResponseEntity.ok("Administrative staff registered successfully");
    }

    @PutMapping("/students/{studentId}/assign-advisor/{advisorId}")
    public ResponseEntity<String> assignAdvisor(@PathVariable Long studentId, @PathVariable Long advisorId) {
        adminService.assignAdvisor(studentId, advisorId);
        return ResponseEntity.ok("Advisor assigned successfully");
    }

    // Paged lists (plan 4.2): ?page=0&size=25&q=term&departmentId=1
    @GetMapping("/students")
    public ResponseEntity<PageResponse<AdminStudentRegisterRequest>> getStudents(
            @RequestParam(required = false) String q, @RequestParam(required = false) Long departmentId,
            @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "25") int size) {
        return ResponseEntity.ok(adminService.getStudents(q, departmentId, page, size));
    }

    @GetMapping("/academicians")
    public ResponseEntity<PageResponse<AdminAcademicianRegisterRequest>> getAcademicians(
            @RequestParam(required = false) String q, @RequestParam(required = false) Long departmentId,
            @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "25") int size) {
        return ResponseEntity.ok(adminService.getAcademicians(q, departmentId, page, size));
    }

    /** id and name of every academician, for the advisor and instructor pickers */
    @GetMapping("/academicians/options")
    public ResponseEntity<List<AcademicianOptionDTO>> getAcademicianOptions() {
        return ResponseEntity.ok(adminService.getAcademicianOptions());
    }

    @GetMapping("/administrative")
    public ResponseEntity<PageResponse<AdminAdministrativeRegisterRequest>> getAdministratives(
            @RequestParam(required = false) String q, @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "25") int size) {
        return ResponseEntity.ok(adminService.getAdministratives(q, page, size));
    }

    @PutMapping("/students/{id}")
    public ResponseEntity<String> updateStudent(@PathVariable Long id, @Valid @RequestBody AdminStudentRegisterRequest request) {
        adminService.updateStudent(id, request);
        return ResponseEntity.ok("Student updated successfully");
    }

    @PutMapping("/academicians/{id}")
    public ResponseEntity<String> updateAcademician(@PathVariable Long id, @Valid @RequestBody AdminAcademicianRegisterRequest request) {
        adminService.updateAcademician(id, request);
        return ResponseEntity.ok("Academician updated successfully");
    }

    @PutMapping("/administrative/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<String> updateAdministrative(@PathVariable Long id, @Valid @RequestBody com.obs.backend.dto.admin.AdminAdministrativeRegisterRequest request) {
        adminService.updateAdministrative(id, request);
        return ResponseEntity.ok("Staff updated successfully");
    }

    /** Deactivates the account (soft delete): the user can no longer sign in, history is kept. */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<String> deactivateUser(@PathVariable Long id, java.security.Principal principal) {
        adminService.deactivateUser(id, principal.getName());
        return ResponseEntity.ok("User deactivated successfully");
    }

    @PatchMapping("/{id}/reactivate")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<String> reactivateUser(@PathVariable Long id) {
        adminService.reactivateUser(id);
        return ResponseEntity.ok("User reactivated successfully");
    }

    @GetMapping("/profile")
    public ResponseEntity<com.obs.backend.dto.admin.AdminProfileDTO> getProfile(java.security.Principal principal) {
        return ResponseEntity.ok(adminService.getAdminProfile(principal.getName()));
    }

    @PutMapping("/profile")
    public ResponseEntity<String> updateProfile(java.security.Principal principal, @Valid @RequestBody com.obs.backend.dto.admin.AdminProfileDTO profileDTO) {
        adminService.updateAdminProfile(principal.getName(), profileDTO);
        return ResponseEntity.ok("Profile updated successfully");
    }
}
