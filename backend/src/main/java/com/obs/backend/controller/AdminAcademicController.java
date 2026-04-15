package com.obs.backend.controller;

import com.obs.backend.dto.admin.AdminCourseDTO;
import com.obs.backend.dto.admin.SemesterDTO;
import com.obs.backend.service.AdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/academics")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'ADMINISTRATIVE')")
public class AdminAcademicController {

    private final AdminService adminService;

    // --- Semester Operations ---

    @GetMapping("/semesters")
    public ResponseEntity<List<SemesterDTO>> getAllSemesters() {
        return ResponseEntity.ok(adminService.getAllSemesters());
    }

    @PostMapping("/semesters")
    public ResponseEntity<SemesterDTO> createSemester(@RequestBody SemesterDTO semesterDTO) {
        return ResponseEntity.ok(adminService.createSemester(semesterDTO));
    }

    @PutMapping("/semesters/{id}")
    public ResponseEntity<SemesterDTO> updateSemester(@PathVariable Long id, @RequestBody SemesterDTO semesterDTO) {
        return ResponseEntity.ok(adminService.updateSemester(id, semesterDTO));
    }

    @PatchMapping("/semesters/{id}/activate")
    public ResponseEntity<Void> activateSemester(@PathVariable Long id) {
        adminService.activateSemester(id);
        return ResponseEntity.ok().build();
    }

    // --- Course Operations ---

    @GetMapping("/courses")
    public ResponseEntity<List<AdminCourseDTO>> getAllCourses() {
        return ResponseEntity.ok(adminService.getAllCourses());
    }

    @PostMapping("/courses")
    public ResponseEntity<AdminCourseDTO> createCourse(@RequestBody AdminCourseDTO courseDTO) {
        return ResponseEntity.ok(adminService.createCourse(courseDTO));
    }

    @PutMapping("/courses/{id}")
    public ResponseEntity<AdminCourseDTO> updateCourse(@PathVariable Long id, @RequestBody AdminCourseDTO courseDTO) {
        return ResponseEntity.ok(adminService.updateCourse(id, courseDTO));
    }

    @PostMapping("/courses/{courseId}/assign-instructor/{instructorId}")
    public ResponseEntity<AdminCourseDTO> assignInstructor(@PathVariable Long courseId, @PathVariable Long instructorId) {
        return ResponseEntity.ok(adminService.assignInstructor(courseId, instructorId));
    }

    @DeleteMapping("/courses/{id}")
    public ResponseEntity<Void> deleteCourse(@PathVariable Long id) {
        adminService.deleteCourse(id);
        return ResponseEntity.ok().build();
    }
}
