package com.obs.backend.controller;

import com.obs.backend.dto.admin.ClassroomDTO;
import com.obs.backend.dto.admin.DepartmentDTO;
import com.obs.backend.dto.admin.FacultyDTO;
import com.obs.backend.service.AdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/infrastructure")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'ADMINISTRATIVE')")
public class AdminController {

    private final AdminService adminService;

    // --- Faculty Management ---

    @GetMapping("/faculties")
    public ResponseEntity<List<FacultyDTO>> getAllFaculties() {
        return ResponseEntity.ok(adminService.getAllFaculties());
    }

    @PostMapping("/faculties")
    public ResponseEntity<FacultyDTO> createFaculty(@RequestBody FacultyDTO facultyDTO) {
        return ResponseEntity.ok(adminService.createFaculty(facultyDTO));
    }

    @PutMapping("/faculties/{id}")
    public ResponseEntity<FacultyDTO> updateFaculty(@PathVariable Long id, @RequestBody FacultyDTO facultyDTO) {
        return ResponseEntity.ok(adminService.updateFaculty(id, facultyDTO));
    }

    @DeleteMapping("/faculties/{id}")
    public ResponseEntity<Void> deleteFaculty(@PathVariable Long id) {
        adminService.deleteFaculty(id);
        return ResponseEntity.ok().build();
    }

    // --- Department Management ---

    @GetMapping("/departments")
    public ResponseEntity<List<DepartmentDTO>> getAllDepartments() {
        return ResponseEntity.ok(adminService.getAllDepartments());
    }

    @PostMapping("/departments")
    public ResponseEntity<DepartmentDTO> createDepartment(@RequestBody DepartmentDTO departmentDTO) {
        return ResponseEntity.ok(adminService.createDepartment(departmentDTO));
    }

    @PutMapping("/departments/{id}")
    public ResponseEntity<DepartmentDTO> updateDepartment(@PathVariable Long id, @RequestBody DepartmentDTO departmentDTO) {
        return ResponseEntity.ok(adminService.updateDepartment(id, departmentDTO));
    }

    @DeleteMapping("/departments/{id}")
    public ResponseEntity<Void> deleteDepartment(@PathVariable Long id) {
        adminService.deleteDepartment(id);
        return ResponseEntity.ok().build();
    }

    // --- Classroom Management ---

    @GetMapping("/classrooms")
    public ResponseEntity<List<ClassroomDTO>> getAllClassrooms() {
        return ResponseEntity.ok(adminService.getAllClassrooms());
    }

    @PostMapping("/classrooms")
    public ResponseEntity<ClassroomDTO> createClassroom(@RequestBody ClassroomDTO classroomDTO) {
        return ResponseEntity.ok(adminService.createClassroom(classroomDTO));
    }

    @PutMapping("/classrooms/{id}")
    public ResponseEntity<ClassroomDTO> updateClassroom(@PathVariable Long id, @RequestBody ClassroomDTO classroomDTO) {
        return ResponseEntity.ok(adminService.updateClassroom(id, classroomDTO));
    }

    @DeleteMapping("/classrooms/{id}")
    public ResponseEntity<Void> deleteClassroom(@PathVariable Long id) {
        adminService.deleteClassroom(id);
        return ResponseEntity.ok().build();
    }
}
