package com.obs.backend.controller;

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
@PreAuthorize("hasAnyRole('ADMIN', 'ADMINISTRATIVE')")
public class AdminUserController {

    private final AdminService adminService;

    @PostMapping("/students")
    public ResponseEntity<String> registerStudent(@RequestBody AdminStudentRegisterRequest request) {
        adminService.registerStudent(request);
        return ResponseEntity.ok("Student registered successfully");
    }

    @PostMapping("/academicians")
    public ResponseEntity<String> registerAcademician(@RequestBody AdminAcademicianRegisterRequest request) {
        adminService.registerAcademician(request);
        return ResponseEntity.ok("Academician registered successfully");
    }

    @PostMapping("/administrative")
    public ResponseEntity<String> registerAdministrative(@RequestBody com.obs.backend.dto.admin.AdminAdministrativeRegisterRequest request) {
        adminService.registerAdministrative(request);
        return ResponseEntity.ok("Administrative staff registered successfully");
    }

    @PutMapping("/students/{studentId}/assign-advisor/{advisorId}")
    public ResponseEntity<String> assignAdvisor(@PathVariable Long studentId, @PathVariable Long advisorId) {
        adminService.assignAdvisor(studentId, advisorId);
        return ResponseEntity.ok("Advisor assigned successfully");
    }

    @GetMapping("/students")
    public ResponseEntity<List<AdminStudentRegisterRequest>> getAllStudents() {
        return ResponseEntity.ok(adminService.getAllStudentsDetail());
    }

    @GetMapping("/academicians")
    public ResponseEntity<List<AdminAcademicianRegisterRequest>> getAllAcademicians() {
        return ResponseEntity.ok(adminService.getAllAcademiciansDetail());
    }

    @GetMapping("/administrative")
    public ResponseEntity<List<AdminAdministrativeRegisterRequest>> getAllAdministratives() {
        return ResponseEntity.ok(adminService.getAllAdministrativesDetail());
    }

    @PutMapping("/students/{id}")
    public ResponseEntity<String> updateStudent(@PathVariable Long id, @RequestBody AdminStudentRegisterRequest request) {
        adminService.updateStudent(id, request);
        return ResponseEntity.ok("Student updated successfully");
    }

    @PutMapping("/academicians/{id}")
    public ResponseEntity<String> updateAcademician(@PathVariable Long id, @RequestBody AdminAcademicianRegisterRequest request) {
        adminService.updateAcademician(id, request);
        return ResponseEntity.ok("Academician updated successfully");
    }

    @PutMapping("/administrative/{id}")
    public ResponseEntity<String> updateAdministrative(@PathVariable Long id, @RequestBody com.obs.backend.dto.admin.AdminAdministrativeRegisterRequest request) {
        adminService.updateAdministrative(id, request);
        return ResponseEntity.ok("Staff updated successfully");
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteUser(@PathVariable Long id) {
        adminService.deleteUser(id);
        return ResponseEntity.ok("User deleted successfully");
    }

    @GetMapping("/profile")
    public ResponseEntity<com.obs.backend.dto.admin.AdminProfileDTO> getProfile(java.security.Principal principal) {
        return ResponseEntity.ok(adminService.getAdminProfile(principal.getName()));
    }

    @PutMapping("/profile")
    public ResponseEntity<String> updateProfile(java.security.Principal principal, @RequestBody com.obs.backend.dto.admin.AdminProfileDTO profileDTO) {
        adminService.updateAdminProfile(principal.getName(), profileDTO);
        return ResponseEntity.ok("Profile updated successfully");
    }
}
