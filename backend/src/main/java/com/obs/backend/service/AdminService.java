package com.obs.backend.service;

import com.obs.backend.dto.admin.AcademicianOptionDTO;
import com.obs.backend.dto.common.PageResponse;

import com.obs.backend.dto.admin.*;

import java.util.List;

public interface AdminService {
    // Faculty Operations
    List<FacultyDTO> getAllFaculties();
    FacultyDTO createFaculty(FacultyDTO facultyDTO);
    FacultyDTO updateFaculty(Long id, FacultyDTO facultyDTO);
    void deleteFaculty(Long id);

    // Department Operations
    List<DepartmentDTO> getAllDepartments();
    DepartmentDTO createDepartment(DepartmentDTO departmentDTO);
    DepartmentDTO updateDepartment(Long id, DepartmentDTO departmentDTO);
    void deleteDepartment(Long id);

    // Classroom Operations
    List<ClassroomDTO> getAllClassrooms();
    ClassroomDTO createClassroom(ClassroomDTO classroomDTO);
    ClassroomDTO updateClassroom(Long id, ClassroomDTO classroomDTO);
    void deleteClassroom(Long id);

    // --- Phase 2: Academic Cycle ---

    // Semester Operations
    List<SemesterDTO> getAllSemesters();
    SemesterDTO createSemester(SemesterDTO semesterDTO);
    SemesterDTO updateSemester(Long id, SemesterDTO semesterDTO);
    void activateSemester(Long id);

    // Course Operations
    PageResponse<AdminCourseDTO> getCourses(String query, Long departmentId, int page, int size);
    AdminCourseDTO createCourse(AdminCourseDTO courseDTO);
    AdminCourseDTO updateCourse(Long id, AdminCourseDTO courseDTO);
    AdminCourseDTO assignInstructor(Long courseId, Long instructorId);
    void deleteCourse(Long id);

    // --- Phase 3: User & Staff Management ---

    // Registration
    void registerStudent(AdminStudentRegisterRequest request);
    void registerAcademician(AdminAcademicianRegisterRequest request);
    void registerAdministrative(AdminAdministrativeRegisterRequest request);

    // Assignments
    void assignAdvisor(Long studentId, Long advisorId);

    // --- Phase 4: Operational Control ---

    // Stats
    AdminDashboardStatsDTO getSystemStats(String username);

    // Announcements
    void sendGlobalAnnouncement(AdminAnnouncementRequest request);

    // Detailed Listings
    // Paged admin lists (plan 4.2); departmentId null means every department
    PageResponse<AdminStudentRegisterRequest> getStudents(String query, Long departmentId, int page, int size);
    PageResponse<AdminAcademicianRegisterRequest> getAcademicians(String query, Long departmentId, int page, int size);
    PageResponse<AdminAdministrativeRegisterRequest> getAdministratives(String query, int page, int size);
    /** Every academician as id and name, for the advisor and instructor pickers. */
    List<AcademicianOptionDTO> getAcademicianOptions();

    // CRUD Updates & Deletes
    void updateStudent(Long id, AdminStudentRegisterRequest request);
    void updateAcademician(Long id, AdminAcademicianRegisterRequest request);
    void updateAdministrative(Long id, AdminAdministrativeRegisterRequest request);
    /** Soft delete: sets the account inactive. Admin accounts and the caller's own account are refused. */
    void deactivateUser(Long id, String actorUsername);

    void reactivateUser(Long id);

    // Profile Operations
    AdminProfileDTO getAdminProfile(String username);
    void updateAdminProfile(String username, AdminProfileDTO profileDTO);
}
