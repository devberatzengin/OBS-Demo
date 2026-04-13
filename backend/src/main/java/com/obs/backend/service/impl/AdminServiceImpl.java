package com.obs.backend.service.impl;

import com.obs.backend.dto.admin.*;
import com.obs.backend.exception.ErrorCode;
import com.obs.backend.exception.ObsException;
import com.obs.backend.model.*;
import com.obs.backend.model.enums.Role;
import com.obs.backend.repository.*;
import com.obs.backend.service.AdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminServiceImpl implements AdminService {

    private final FacultyRepository facultyRepository;
    private final DepartmentRepository departmentRepository;
    private final ClassroomRepository classroomRepository;
    private final SemesterRepository semesterRepository;
    private final CourseRepository courseRepository;
    private final AcademicianRepository academicianRepository;
    private final StudentRepository studentRepository;
    private final AdministrativeRepository administrativeRepository;
    private final UserRepository userRepository;
    private final NotificationRepository notificationRepository;
    private final com.obs.backend.service.LoggingService loggingService;
    private final PasswordEncoder passwordEncoder;

    // --- Faculty Operations ---

    @Override
    public List<FacultyDTO> getAllFaculties() {
        return facultyRepository.findAll().stream()
                .map(f -> FacultyDTO.builder().id(f.getId()).name(f.getName()).build())
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public FacultyDTO createFaculty(FacultyDTO facultyDTO) {
        Faculty faculty = Faculty.builder()
                .name(facultyDTO.getName())
                .build();
        @lombok.NonNull Faculty saved = facultyRepository.save(faculty);
        return FacultyDTO.builder().id(saved.getId()).name(saved.getName()).build();
    }

    @Override
    @Transactional
    public FacultyDTO updateFaculty(@lombok.NonNull Long id, @lombok.NonNull FacultyDTO facultyDTO) {
        Faculty faculty = facultyRepository.findById(id)
                .orElseThrow(() -> new ObsException(ErrorCode.RESOURCE_NOT_FOUND, "Faculty not found"));
        faculty.setName(facultyDTO.getName());
        @lombok.NonNull Faculty updated = facultyRepository.save(faculty);
        return FacultyDTO.builder().id(updated.getId()).name(updated.getName()).build();
    }

    @Override
    @Transactional
    public void deleteFaculty(@lombok.NonNull Long id) {
        if (!facultyRepository.existsById(id)) {
            throw new ObsException(ErrorCode.RESOURCE_NOT_FOUND, "Faculty not found");
        }
        facultyRepository.deleteById(id);
    }

    // --- Department Operations ---

    @Override
    public List<DepartmentDTO> getAllDepartments() {
        return departmentRepository.findAll().stream()
                .map(d -> DepartmentDTO.builder()
                        .id(d.getId())
                        .name(d.getName())
                        .facultyId(d.getFaculty() != null ? d.getFaculty().getId() : null)
                        .facultyName(d.getFaculty() != null ? d.getFaculty().getName() : "N/A")
                        .build())
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public DepartmentDTO createDepartment(@lombok.NonNull DepartmentDTO departmentDTO) {
        Faculty faculty = facultyRepository.findById(departmentDTO.getFacultyId())
                .orElseThrow(() -> new ObsException(ErrorCode.RESOURCE_NOT_FOUND, "Faculty not found for department"));
        
        Department department = Department.builder()
                .name(departmentDTO.getName())
                .faculty(faculty)
                .build();
        @lombok.NonNull Department saved = departmentRepository.save(department);
        
        return DepartmentDTO.builder()
                .id(saved.getId())
                .name(saved.getName())
                .facultyId(faculty.getId())
                .facultyName(faculty.getName())
                .build();
    }

    @Override
    @Transactional
    public DepartmentDTO updateDepartment(@lombok.NonNull Long id, @lombok.NonNull DepartmentDTO departmentDTO) {
        Department department = departmentRepository.findById(id)
                .orElseThrow(() -> new ObsException(ErrorCode.RESOURCE_NOT_FOUND, "Department not found"));
        
        department.setName(departmentDTO.getName());
        
        if (departmentDTO.getFacultyId() != null) {
            Faculty faculty = facultyRepository.findById(departmentDTO.getFacultyId())
                    .orElseThrow(() -> new ObsException(ErrorCode.RESOURCE_NOT_FOUND, "Faculty not found"));
            department.setFaculty(faculty);
        }
        
        @lombok.NonNull Department updated = departmentRepository.save(department);
        return DepartmentDTO.builder()
                .id(updated.getId())
                .name(updated.getName())
                .facultyId(updated.getFaculty() != null ? updated.getFaculty().getId() : null)
                .facultyName(updated.getFaculty() != null ? updated.getFaculty().getName() : "N/A")
                .build();
    }

    @Override
    @Transactional
    public void deleteDepartment(@lombok.NonNull Long id) {
        if (!departmentRepository.existsById(id)) {
            throw new ObsException(ErrorCode.RESOURCE_NOT_FOUND, "Department not found");
        }
        departmentRepository.deleteById(id);
    }

    // --- Classroom Operations ---

    @Override
    public List<ClassroomDTO> getAllClassrooms() {
        return classroomRepository.findAll().stream()
                .map(c -> ClassroomDTO.builder()
                        .id(c.getId())
                        .code(c.getCode())
                        .capacity(c.getCapacity())
                        .build())
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public ClassroomDTO createClassroom(ClassroomDTO classroomDTO) {
        Classroom classroom = Classroom.builder()
                .code(classroomDTO.getCode())
                .capacity(classroomDTO.getCapacity())
                .build();
        @lombok.NonNull Classroom saved = classroomRepository.save(classroom);
        return ClassroomDTO.builder().id(saved.getId()).code(saved.getCode()).capacity(saved.getCapacity()).build();
    }

    @Override
    @Transactional
    public ClassroomDTO updateClassroom(@lombok.NonNull Long id, @lombok.NonNull ClassroomDTO classroomDTO) {
        Classroom classroom = classroomRepository.findById(id)
                .orElseThrow(() -> new ObsException(ErrorCode.RESOURCE_NOT_FOUND, "Classroom not found"));
        
        classroom.setCode(classroomDTO.getCode());
        classroom.setCapacity(classroomDTO.getCapacity());
        
        @lombok.NonNull Classroom updated = classroomRepository.save(classroom);
        return ClassroomDTO.builder().id(updated.getId()).code(updated.getCode()).capacity(updated.getCapacity()).build();
    }

    @Override
    @Transactional
    public void deleteClassroom(@lombok.NonNull Long id) {
        if (!classroomRepository.existsById(id)) {
            throw new ObsException(ErrorCode.RESOURCE_NOT_FOUND, "Classroom not found");
        }
        classroomRepository.deleteById(id);
    }

    // --- Phase 2: Academic Cycle ---

    // Semester Operations

    @Override
    public List<SemesterDTO> getAllSemesters() {
        return semesterRepository.findAll().stream()
                .map(s -> SemesterDTO.builder()
                        .id(s.getId())
                        .name(s.getName())
                        .startDate(s.getStartDate())
                        .endDate(s.getEndDate())
                        .examStartDate(s.getExamStartDate())
                        .examEndDate(s.getExamEndDate())
                        .makeupExamStartDate(s.getMakeupExamStartDate())
                        .makeupExamEndDate(s.getMakeupExamEndDate())
                        .registrationStartDate(s.getRegistrationStartDate())
                        .registrationEndDate(s.getRegistrationEndDate())
                        .isActive(s.isActive())
                        .build())
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public SemesterDTO createSemester(@lombok.NonNull SemesterDTO semesterDTO) {
        Semester semester = Semester.builder()
                .name(semesterDTO.getName())
                .startDate(semesterDTO.getStartDate())
                .endDate(semesterDTO.getEndDate())
                .examStartDate(semesterDTO.getExamStartDate())
                .examEndDate(semesterDTO.getExamEndDate())
                .makeupExamStartDate(semesterDTO.getMakeupExamStartDate())
                .makeupExamEndDate(semesterDTO.getMakeupExamEndDate())
                .registrationStartDate(semesterDTO.getRegistrationStartDate())
                .registrationEndDate(semesterDTO.getRegistrationEndDate())
                .isActive(false)
                .build();
        @lombok.NonNull Semester saved = semesterRepository.save(semester);
        return SemesterDTO.builder()
                .id(saved.getId())
                .name(saved.getName())
                .startDate(saved.getStartDate())
                .endDate(saved.getEndDate())
                .examStartDate(saved.getExamStartDate())
                .examEndDate(saved.getExamEndDate())
                .makeupExamStartDate(saved.getMakeupExamStartDate())
                .makeupExamEndDate(saved.getMakeupExamEndDate())
                .registrationStartDate(saved.getRegistrationStartDate())
                .registrationEndDate(saved.getRegistrationEndDate())
                .isActive(saved.isActive())
                .build();
    }

    @Override
    public SemesterDTO updateSemester(Long id, SemesterDTO semesterDTO) {
        Semester semester = semesterRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Semester not found"));
        
        semester.setName(semesterDTO.getName());
        semester.setStartDate(semesterDTO.getStartDate());
        semester.setEndDate(semesterDTO.getEndDate());
        semester.setExamStartDate(semesterDTO.getExamStartDate());
        semester.setExamEndDate(semesterDTO.getExamEndDate());
        semester.setMakeupExamStartDate(semesterDTO.getMakeupExamStartDate());
        semester.setMakeupExamEndDate(semesterDTO.getMakeupExamEndDate());
        semester.setRegistrationStartDate(semesterDTO.getRegistrationStartDate());
        semester.setRegistrationEndDate(semesterDTO.getRegistrationEndDate());
        
        Semester saved = semesterRepository.save(semester);
        return SemesterDTO.builder()
                .id(saved.getId())
                .name(saved.getName())
                .startDate(saved.getStartDate())
                .endDate(saved.getEndDate())
                .examStartDate(saved.getExamStartDate())
                .examEndDate(saved.getExamEndDate())
                .makeupExamStartDate(saved.getMakeupExamStartDate())
                .makeupExamEndDate(saved.getMakeupExamEndDate())
                .registrationStartDate(saved.getRegistrationStartDate())
                .registrationEndDate(saved.getRegistrationEndDate())
                .isActive(saved.isActive())
                .build();
    }

    @Override
    @Transactional
    public void activateSemester(@lombok.NonNull Long id) {
        // 1. Deactivate all others
        List<Semester> activeSemesters = semesterRepository.findAll().stream()
                .filter(Semester::isActive)
                .collect(Collectors.toList());
        
        for (Semester s : activeSemesters) {
            s.setActive(false);
        }
        semesterRepository.saveAll(activeSemesters);

        // 2. Activate target
        Semester target = semesterRepository.findById(id)
                .orElseThrow(() -> new ObsException(ErrorCode.RESOURCE_NOT_FOUND, "Semester not found"));
        target.setActive(true);
        semesterRepository.save(target);
    }

    // Course Operations

    @Override
    public List<AdminCourseDTO> getAllCourses() {
        return courseRepository.findAll().stream()
                .map(this::mapToAdminCourseDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public AdminCourseDTO createCourse(@lombok.NonNull AdminCourseDTO courseDTO) {
        Department dept = departmentRepository.findById(courseDTO.getDepartmentId())
                .orElseThrow(() -> new ObsException(ErrorCode.RESOURCE_NOT_FOUND, "Department not found"));
        
        Course course = Course.builder()
                .code(courseDTO.getCode())
                .name(courseDTO.getName())
                .akts(courseDTO.getAkts())
                .credits(courseDTO.getCredits())
                .semesterLevel(courseDTO.getSemesterLevel())
                .department(dept)
                .build();

        if (courseDTO.getInstructorId() != null) {
            Academician instructor = academicianRepository.findById(courseDTO.getInstructorId())
                    .orElseThrow(() -> new ObsException(ErrorCode.RESOURCE_NOT_FOUND, "Instructor not found"));
            course.setInstructor(instructor);
        }

        @lombok.NonNull Course saved = courseRepository.save(course);
        loggingService.log("COURSE_CREATED", "New course: " + saved.getCode() + " - " + saved.getName(), "SYSTEM", "COURSE", saved.getId().toString());
        return mapToAdminCourseDTO(saved);
    }

    @Override
    @Transactional
    public AdminCourseDTO updateCourse(@lombok.NonNull Long id, @lombok.NonNull AdminCourseDTO courseDTO) {
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new ObsException(ErrorCode.RESOURCE_NOT_FOUND, "Course not found"));
        
        course.setName(courseDTO.getName());
        course.setAkts(courseDTO.getAkts());
        course.setCredits(courseDTO.getCredits());
        course.setSemesterLevel(courseDTO.getSemesterLevel());
        
        if (courseDTO.getDepartmentId() != null) {
            Department dept = departmentRepository.findById(courseDTO.getDepartmentId())
                    .orElseThrow(() -> new ObsException(ErrorCode.RESOURCE_NOT_FOUND, "Department not found"));
            course.setDepartment(dept);
        }

        @lombok.NonNull Course updatedCourse = courseRepository.save(course);
        loggingService.log("COURSE_UPDATED", "Updated course info: " + updatedCourse.getCode(), "SYSTEM", "COURSE", updatedCourse.getId().toString());
        return mapToAdminCourseDTO(updatedCourse);
    }

    @Override
    @Transactional
    public AdminCourseDTO assignInstructor(@lombok.NonNull Long courseId, @lombok.NonNull Long instructorId) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ObsException(ErrorCode.RESOURCE_NOT_FOUND, "Course not found"));
        
        Academician instructor = academicianRepository.findById(instructorId)
                .orElseThrow(() -> new ObsException(ErrorCode.RESOURCE_NOT_FOUND, "Instructor not found"));
        
        course.setInstructor(instructor);
        @lombok.NonNull Course updatedInstructor = courseRepository.save(course);
        loggingService.log("INSTRUCTOR_ASSIGNED", "Instructor assigned to: " + updatedInstructor.getCode(), "SYSTEM", "COURSE", updatedInstructor.getId().toString());
        return mapToAdminCourseDTO(updatedInstructor);
    }

    @Override
    @Transactional
    public void deleteCourse(@lombok.NonNull Long id) {
        if (!courseRepository.existsById(id)) {
            throw new ObsException(ErrorCode.RESOURCE_NOT_FOUND, "Course not found");
        }
        courseRepository.deleteById(id);
    }

    // --- Phase 3: User & Staff Management ---

    @Override
    @Transactional
    public void registerStudent(@lombok.NonNull AdminStudentRegisterRequest request) {
        // 1. Validation
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new ObsException(ErrorCode.ALREADY_EXISTS, "Username is already taken");
        }
        
        Department dept = departmentRepository.findById(request.getDepartmentId())
                .orElseThrow(() -> new ObsException(ErrorCode.RESOURCE_NOT_FOUND, "Department not found"));

        Academician advisor = null;
        if (request.getAdvisorId() != null) {
            advisor = academicianRepository.findById(request.getAdvisorId())
                    .orElseThrow(() -> new ObsException(ErrorCode.RESOURCE_NOT_FOUND, "Advisor not found"));
        }

        // 2. Encryption
        String encodedPassword = passwordEncoder.encode(request.getPassword());

        // 3. Create Student Entity (Inheritance: Joined)
        Student student = Student.builder()
                .username(request.getUsername())
                .password(encodedPassword)
                .email(request.getEmail())
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .role(Role.STUDENT)
                .isActive(true)
                .studentNumber(request.getStudentNumber())
                .department(dept)
                .advisor(advisor)
                .currentSemester(1)
                .gpa(0.0)
                .build();

        studentRepository.save(student);
        loggingService.log("STUDENT_REGISTERED", "New student: " + student.getUsername() + " (" + student.getFirstName() + " " + student.getLastName() + ")", "SYSTEM", "STUDENT", student.getId().toString());
    }

    @Override
    @Transactional
    public void registerAcademician(@lombok.NonNull AdminAcademicianRegisterRequest request) {
        // 1. Validation
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new ObsException(ErrorCode.ALREADY_EXISTS, "Username is already taken");
        }

        Department dept = departmentRepository.findById(request.getDepartmentId())
                .orElseThrow(() -> new ObsException(ErrorCode.RESOURCE_NOT_FOUND, "Department not found"));

        // 2. Encryption
        String encodedPassword = passwordEncoder.encode(request.getPassword());

        // 3. Create Academician Entity
        Academician academician = Academician.builder()
                .username(request.getUsername())
                .password(encodedPassword)
                .email(request.getEmail())
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .role(Role.ACADEMICIAN)
                .isActive(true)
                .staffNumber(request.getStaffNumber())
                .academicTitle(request.getAcademicTitle())
                .department(dept)
                .build();

        academicianRepository.save(academician);
        loggingService.log("ACADEMICIAN_REGISTERED", "New academician: " + academician.getAcademicTitle() + " " + academician.getFirstName() + " " + academician.getLastName(), "SYSTEM", "ACADEMICIAN", academician.getId().toString());
    }

    @Override
    @Transactional
    public void registerAdministrative(@lombok.NonNull AdminAdministrativeRegisterRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new ObsException(ErrorCode.ALREADY_EXISTS, "Username is already taken");
        }

        String encodedPassword = passwordEncoder.encode(request.getPassword());

        Administrative administrative = Administrative.builder()
                .username(request.getUsername())
                .password(encodedPassword)
                .email(request.getEmail())
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .role(Role.ADMINISTRATIVE)
                .isActive(true)
                .staffNumber(request.getStaffNumber())
                .position(request.getPosition())
                .build();

        administrativeRepository.save(administrative);
        loggingService.log("STAFF_REGISTERED", "New staff: " + administrative.getFirstName() + " " + administrative.getLastName() + " (" + administrative.getPosition() + ")", "SYSTEM", "ADMINISTRATIVE", administrative.getId().toString());
    }

    @Override
    @Transactional
    public void assignAdvisor(@lombok.NonNull Long studentId, @lombok.NonNull Long advisorId) {
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new ObsException(ErrorCode.RESOURCE_NOT_FOUND, "Student not found"));

        Academician advisor = academicianRepository.findById(advisorId)
                .orElseThrow(() -> new ObsException(ErrorCode.RESOURCE_NOT_FOUND, "Advisor not found"));

        student.setAdvisor(advisor);
        studentRepository.save(student);
    }

    // --- Phase 4: Operational Control ---

    @Override
    public AdminDashboardStatsDTO getSystemStats(String username) {
        User user = userRepository.findByUsername(username).orElse(null);
        
        long studentCount = studentRepository.count();
        long academicianCount = academicianRepository.count();
        long administrativeCount = userRepository.findAllByRoleIn(java.util.Arrays.asList(com.obs.backend.model.enums.Role.ADMIN, com.obs.backend.model.enums.Role.ADMINISTRATIVE)).size();
        long departmentCount = departmentRepository.count();
        long facultyCount = facultyRepository.count();
        long courseCount = courseRepository.count();
        
        String unitName = "University-wide";

        if (user != null && user.getRole() == Role.ADMINISTRATIVE) {
            Administrative admin = administrativeRepository.findById(user.getId()).orElse(null);
            if (admin != null) {
                if (admin.getDepartment() != null) {
                    studentCount = studentRepository.countByDepartmentId(admin.getDepartment().getId());
                    academicianCount = academicianRepository.countByDepartmentId(admin.getDepartment().getId());
                    courseCount = courseRepository.countByDepartmentId(admin.getDepartment().getId());
                    departmentCount = 1;
                    facultyCount = 1;
                    unitName = admin.getDepartment().getName();
                } else if (admin.getFaculty() != null) {
                    studentCount = studentRepository.countByDepartmentFacultyId(admin.getFaculty().getId());
                    academicianCount = academicianRepository.countByDepartmentFacultyId(admin.getFaculty().getId());
                    courseCount = courseRepository.countByDepartmentFacultyId(admin.getFaculty().getId());
                    departmentCount = departmentRepository.countByFacultyId(admin.getFaculty().getId());
                    facultyCount = 1;
                    unitName = admin.getFaculty().getName();
                }
            }
        }

        return AdminDashboardStatsDTO.builder()
                .studentCount(studentCount)
                .academicianCount(academicianCount)
                .departmentCount(departmentCount)
                .facultyCount(facultyCount)
                .courseCount(courseCount)
                .administrativeCount(administrativeCount)
                .unitName(unitName)
                .activeSemesterName(semesterRepository.findAll().stream()
                        .filter(Semester::isActive)
                        .findFirst()
                        .map(Semester::getName)
                        .orElse("No Active Semester"))
                .build();
    }

    @Override
    @Transactional
    public void sendGlobalAnnouncement(@lombok.NonNull AdminAnnouncementRequest request) {
        // Entegrasyon: Tüm hedef kullanıcılara notification oluşturma
        List<User> targetUsers;
        
        String role = (request.getTargetRole() != null) ? request.getTargetRole().toUpperCase() : "ALL";
        
        switch (role) {
            case "STUDENT" -> targetUsers = userRepository.findAll().stream()
                    .filter(u -> u.getRole() != null && u.getRole() == Role.STUDENT).collect(Collectors.toList());
            case "ACADEMICIAN" -> targetUsers = userRepository.findAll().stream()
                    .filter(u -> u.getRole() != null && u.getRole() == Role.ACADEMICIAN).collect(Collectors.toList());
            default -> targetUsers = userRepository.findAll();
        }

        List<Notification> announcements = targetUsers.stream()
                .map(u -> Notification.builder()
                        .user(u)
                        .title(request.getTitle())
                        .message(request.getContent())
                        .isRead(false)
                        .build())
                .collect(Collectors.toList());

        @lombok.NonNull List<Notification> announcementsToSave = announcements;
        notificationRepository.saveAll(announcementsToSave);
    }

    @Override
    public List<AdminStudentRegisterRequest> getAllStudentsDetail() {
        return studentRepository.findAll().stream()
                .map(s -> AdminStudentRegisterRequest.builder()
                        .id(s.getId())
                        .username(s.getUsername())
                        .email(s.getEmail())
                        .firstName(s.getFirstName())
                        .lastName(s.getLastName())
                        .studentNumber(s.getStudentNumber())
                        .departmentId(s.getDepartment() != null ? s.getDepartment().getId() : null)
                        .advisorId(s.getAdvisor() != null ? s.getAdvisor().getId() : null)
                        .build())
                .collect(Collectors.toList());
    }

    @Override
    public List<AdminAcademicianRegisterRequest> getAllAcademiciansDetail() {
        return academicianRepository.findAll().stream()
                .map(a -> AdminAcademicianRegisterRequest.builder()
                        .id(a.getId())
                        .username(a.getUsername())
                        .email(a.getEmail())
                        .firstName(a.getFirstName())
                        .lastName(a.getLastName())
                        .academicTitle(a.getAcademicTitle())
                        .departmentId(a.getDepartment().getId())
                        .officeNumber(a.getOfficeNumber())
                        .staffNumber(a.getStaffNumber())
                        .build())
                .collect(Collectors.toList());
    }

    @Override
    public List<AdminAdministrativeRegisterRequest> getAllAdministrativesDetail() {
        return userRepository.findAllByRoleIn(java.util.Arrays.asList(com.obs.backend.model.enums.Role.ADMIN, com.obs.backend.model.enums.Role.ADMINISTRATIVE))
                .stream()
                .map(u -> {
                    Administrative adminData = administrativeRepository.findById(u.getId()).orElse(null);
                    return AdminAdministrativeRegisterRequest.builder()
                            .id(u.getId())
                            .username(u.getUsername())
                            .email(u.getEmail())
                            .firstName(u.getFirstName())
                            .lastName(u.getLastName())
                            .staffNumber(adminData != null ? adminData.getStaffNumber() : "N/A")
                            .position(adminData != null ? adminData.getPosition() : (u.getRole() == com.obs.backend.model.enums.Role.ADMIN ? "Root Admin" : "Staff"))
                            .build();
                })
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void updateStudent(Long id, AdminStudentRegisterRequest request) {
        Student student = studentRepository.findById(id)
                .orElseThrow(() -> new ObsException(ErrorCode.RESOURCE_NOT_FOUND, "Student not found"));
        
        student.setEmail(request.getEmail());
        student.setFirstName(request.getFirstName());
        student.setLastName(request.getLastName());
        
        if (request.getPassword() != null && !request.getPassword().isEmpty()) {
            student.setPassword(passwordEncoder.encode(request.getPassword()));
        }
        
        if (request.getDepartmentId() != null) {
            Department dept = departmentRepository.findById(request.getDepartmentId()).orElse(null);
            student.setDepartment(dept);
        }
        
        studentRepository.save(student);
    }

    @Override
    @Transactional
    public void updateAcademician(Long id, AdminAcademicianRegisterRequest request) {
        Academician academician = academicianRepository.findById(id)
                .orElseThrow(() -> new ObsException(ErrorCode.RESOURCE_NOT_FOUND, "Academician not found"));
        
        academician.setEmail(request.getEmail());
        academician.setFirstName(request.getFirstName());
        academician.setLastName(request.getLastName());
        academician.setAcademicTitle(request.getAcademicTitle());
        
        if (request.getPassword() != null && !request.getPassword().isEmpty()) {
            academician.setPassword(passwordEncoder.encode(request.getPassword()));
        }

        if (request.getDepartmentId() != null) {
            Department dept = departmentRepository.findById(request.getDepartmentId()).orElse(null);
            academician.setDepartment(dept);
        }

        academicianRepository.save(academician);
    }

    @Override
    @Transactional
    public void updateAdministrative(Long id, AdminAdministrativeRegisterRequest request) {
        Administrative administrative = administrativeRepository.findById(id)
                .orElseThrow(() -> new ObsException(ErrorCode.RESOURCE_NOT_FOUND, "Staff not found"));
        
        administrative.setEmail(request.getEmail());
        administrative.setFirstName(request.getFirstName());
        administrative.setLastName(request.getLastName());
        administrative.setPosition(request.getPosition());
        
        if (request.getPassword() != null && !request.getPassword().isEmpty()) {
            administrative.setPassword(passwordEncoder.encode(request.getPassword()));
        }

        administrativeRepository.save(administrative);
    }

    @Override
    @Transactional
    public void deleteUser(Long id) {
        if (!userRepository.existsById(id)) {
            throw new ObsException(ErrorCode.RESOURCE_NOT_FOUND, "User not found");
        }
        userRepository.deleteById(id);
    }

    @Override
    public AdminProfileDTO getAdminProfile(String username) {
        Administrative admin = administrativeRepository.findByUsername(username)
                .orElseThrow(() -> new ObsException(ErrorCode.RESOURCE_NOT_FOUND, "Administrative profile not found"));
        
        return AdminProfileDTO.builder()
                .id(admin.getId())
                .fullName(admin.getFirstName() + " " + admin.getLastName())
                .email(admin.getEmail())
                .phoneNumber(admin.getPhoneNumber())
                .address(admin.getAddress())
                .staffNumber(admin.getStaffNumber())
                .position(admin.getPosition())
                .facultyName(admin.getFaculty() != null ? admin.getFaculty().getName() : "N/A")
                .departmentName(admin.getDepartment() != null ? admin.getDepartment().getName() : "N/A")
                .build();
    }

    @Override
    @Transactional
    public void updateAdminProfile(String username, AdminProfileDTO profileDTO) {
        Administrative admin = administrativeRepository.findByUsername(username)
                .orElseThrow(() -> new ObsException(ErrorCode.RESOURCE_NOT_FOUND, "Administrative profile not found"));
        
        admin.setEmail(profileDTO.getEmail());
        admin.setPhoneNumber(profileDTO.getPhoneNumber());
        admin.setAddress(profileDTO.getAddress());
        
        administrativeRepository.save(admin);
    }

    private AdminCourseDTO mapToAdminCourseDTO(Course c) {
        return AdminCourseDTO.builder()
                .id(c.getId())
                .code(c.getCode())
                .name(c.getName())
                .akts(c.getAkts())
                .credits(c.getCredits())
                .semesterLevel(c.getSemesterLevel())
                .departmentId(c.getDepartment() != null ? c.getDepartment().getId() : null)
                .departmentName(c.getDepartment() != null ? c.getDepartment().getName() : "N/A")
                .instructorId(c.getInstructor() != null ? c.getInstructor().getId() : null)
                .instructorName(c.getInstructor() != null ? 
                    c.getInstructor().getAcademicTitle() + " " + c.getInstructor().getFirstName() + " " + c.getInstructor().getLastName() : "Unassigned")
                .build();
    }
}
