package com.obs.backend.service;

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
    List<AdminCourseDTO> getAllCourses();
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
    List<AdminStudentRegisterRequest> getAllStudentsDetail();
    List<AdminAcademicianRegisterRequest> getAllAcademiciansDetail();
    List<AdminAdministrativeRegisterRequest> getAllAdministrativesDetail();

    // CRUD Updates & Deletes
    void updateStudent(Long id, AdminStudentRegisterRequest request);
    void updateAcademician(Long id, AdminAcademicianRegisterRequest request);
    void updateAdministrative(Long id, AdminAdministrativeRegisterRequest request);
    void deleteUser(Long id);

    // Profile Operations
    AdminProfileDTO getAdminProfile(String username);
    void updateAdminProfile(String username, AdminProfileDTO profileDTO);
}
