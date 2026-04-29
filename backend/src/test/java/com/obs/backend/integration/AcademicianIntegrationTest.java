package com.obs.backend.integration;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.obs.backend.dto.academician.*;
import com.obs.backend.model.*;
import com.obs.backend.model.enums.ExamType;
import com.obs.backend.model.enums.Role;
import com.obs.backend.repository.*;
import com.obs.backend.model.enums.EnrollmentStatus;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
@Transactional
public class AcademicianIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private AcademicianRepository academicianRepository;

    @Autowired
    private FacultyRepository facultyRepository;

    @Autowired
    private DepartmentRepository departmentRepository;

    @Autowired
    private CourseRepository courseRepository;

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private UserDetailsService userDetailsService;

    @Autowired
    private ClassroomRepository classroomRepository;

    @Autowired
    private SemesterRepository semesterRepository;

    @Autowired
    private ExamRepository examRepository;

    @Autowired
    private EnrollmentRepository enrollmentRepository;

    @Autowired
    private AttendanceRecordRepository attendanceRecordRepository;

    private Academician testHoca;
    private Classroom testClassroom;
    private Semester testSemester;
    private String uniqueId;

    @BeforeEach
    void setup() {
        uniqueId = String.valueOf(System.currentTimeMillis());
        
        // Cleanup existing active semesters to avoid NonUniqueResultException
        semesterRepository.findAll().forEach(s -> {
            @lombok.NonNull Semester sem = s;
            sem.setActive(false);
            semesterRepository.save(sem);
        });
        
        testSemester = semesterRepository.save(Semester.builder().name("Semester " + uniqueId).isActive(true).build());
        @lombok.NonNull Faculty faculty = facultyRepository.save(Faculty.builder().name("Faculty " + uniqueId).build());
        @lombok.NonNull Department dept = departmentRepository.save(Department.builder().name("Dept " + uniqueId).faculty(faculty).build());
        testClassroom = classroomRepository.save(Classroom.builder().code("ROOM_" + uniqueId).capacity(50).build());

        testHoca = academicianRepository.save(Academician.builder()
                .username("hoca_" + uniqueId)
                .password("pass")
                .email("hoca_" + uniqueId + "@uni.edu")
                .firstName("Acad")
                .lastName("Test")
                .isActive(true)
                .role(Role.ACADEMICIAN)
                .staffNumber("STAFF_" + uniqueId)
                .department(dept)
                .build());

        @lombok.NonNull Course course = courseRepository.save(Course.builder()
                .code("CODE_" + uniqueId)
                .name("Course " + uniqueId)
                .akts(5)
                .credits(3)
                .department(dept)
                .instructor(testHoca)
                .build());

        @lombok.NonNull Student student = studentRepository.save(Student.builder()
                .username("student_" + uniqueId)
                .password("pass")
                .email("student_" + uniqueId + "@student.edu")
                .firstName("Stu")
                .lastName("Test")
                .isActive(true)
                .role(Role.STUDENT)
                .studentNumber("STU_" + uniqueId)
                .department(dept)
                .advisor(testHoca)
                .currentSemester(1)
                .gpa(3.5)
                .build());

        // Create Enrollment (Approved by default for legacy tests)
        @lombok.NonNull Enrollment enrollment = Enrollment.builder()
                .course(course)
                .student(student)
                .semester(testSemester)
                .status(EnrollmentStatus.APPROVED)
                .build();
        enrollmentRepository.save(enrollment);

        login(testHoca.getUsername());
    }
    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    @Order(1)
    @DisplayName("Should list my courses")
    void shouldListMyCourses() throws Exception {
        mockMvc.perform(get("/api/academician/courses"))
                .andExpect(status().isOk());
    }

    @Test
    @Order(2)
    @DisplayName("Should list my advisees")
    void shouldListMyAdvisees() throws Exception {
        mockMvc.perform(get("/api/academician/advisees"))
                .andExpect(status().isOk());
    }

    @Test
    @Order(3)
    @DisplayName("Should update course syllabus")
    void shouldUpdateSyllabus() throws Exception {
        Course course = courseRepository.findByInstructorId(testHoca.getId()).get(0);
        String json = "{\"description\":\"New Desc\", \"syllabus\":\"Week 1: Intro\"}";

        mockMvc.perform(put("/api/academician/courses/" + course.getId() + "/syllabus")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isOk());

        Course updated = courseRepository.findById(course.getId()).orElseThrow();
        Assertions.assertEquals("New Desc", updated.getDescription());
    }

    @Test
    @Order(4)
    @DisplayName("Should get my schedule")
    void shouldGetMySchedule() throws Exception {
        mockMvc.perform(get("/api/academician/schedule"))
                .andExpect(status().isOk());
    }

    @Test
    @Order(5)
    @DisplayName("Should get advisee performance")
    void shouldGetAdviseePerformance() throws Exception {
        mockMvc.perform(get("/api/academician/advisees/performance"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].atRisk").isBoolean());
    }

    @Test
    @Order(6)
    @DisplayName("Should forbid access for non-academician users")
    void shouldForbidNonAcademician() throws Exception {
        // Switch to student manual login
        String studentUsername = "student_" + uniqueId;
        UserDetails userDetails = userDetailsService.loadUserByUsername(studentUsername);
        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
        SecurityContextHolder.getContext().setAuthentication(auth);

        mockMvc.perform(get("/api/academician/courses"))
                .andExpect(status().isForbidden());
    }

    @Test
    @Order(7)
    @DisplayName("Should create exam")
    void shouldCreateExam() throws Exception {
        Course course = courseRepository.findByInstructorId(testHoca.getId()).get(0);
        ExamRequest request = ExamRequest.builder()
                .examType(ExamType.MIDTERM)
                .examDate(LocalDateTime.now().plusDays(7))
                .ratio(40.0)
                .classroomId(testClassroom.getId())
                .build();

        mockMvc.perform(post("/api/academician/courses/" + course.getId() + "/exams")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());

        List<Exam> exams = examRepository.findByCourseId(course.getId());
        Assertions.assertFalse(exams.isEmpty());
        Assertions.assertEquals(40.0, exams.get(0).getRatio());
    }

    @Test
    @Order(8)
    @DisplayName("Should enter grades and calculate score")
    void shouldEnterGrades() throws Exception {
        Course course = courseRepository.findByInstructorId(testHoca.getId()).get(0);
        Student student = studentRepository.findByAdvisorId(testHoca.getId()).get(0);
        
        // Ensure enrollment exists
        Enrollment enrollment = enrollmentRepository.findByCourseIdAndStudentId(course.getId(), student.getId()).orElseThrow();

        // Create Midterm exam (40%)
        Exam midterm = examRepository.save(Exam.builder()
                .examType(ExamType.MIDTERM).examDate(LocalDateTime.now()).ratio(40.0)
                .course(course).classroom(testClassroom).semester(testSemester).build());

        // Create Final exam (60%)
        Exam finalExam = examRepository.save(Exam.builder()
                .examType(ExamType.FINAL).examDate(LocalDateTime.now()).ratio(60.0)
                .course(course).classroom(testClassroom).semester(testSemester).build());

        // Midterm grade: 80
        GradeEntryRequest midtermGrade = GradeEntryRequest.builder()
                .grades(List.of(GradeEntryRequest.StudentGradeDTO.builder().studentId(student.getId()).score(80.0).build()))
                .build();

        mockMvc.perform(post("/api/academician/exams/" + midterm.getId() + "/grades")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(midtermGrade)))
                .andExpect(status().isOk());

        // Midterm result: 80 * 0.4 = 32
        Enrollment updated1 = enrollmentRepository.findById(enrollment.getId()).orElseThrow();
        Assertions.assertEquals(32.0, updated1.getScore());

        // Final grade: 90
        GradeEntryRequest finalGrade = GradeEntryRequest.builder()
                .grades(List.of(GradeEntryRequest.StudentGradeDTO.builder().studentId(student.getId()).score(90.0).build()))
                .build();

        mockMvc.perform(post("/api/academician/exams/" + finalExam.getId() + "/grades")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(finalGrade)))
                .andExpect(status().isOk());

        // Final result: (80*0.4) + (90*0.6) = 32 + 54 = 86 (BA)
        Enrollment updated2 = enrollmentRepository.findById(enrollment.getId()).orElseThrow();
        Assertions.assertEquals(86.0, updated2.getScore());
        Assertions.assertEquals("BA", updated2.getGrade());
    }

    @Test
    @Order(9)
    @DisplayName("Should record attendance")
    void shouldRecordAttendance() throws Exception {
        Course course = courseRepository.findByInstructorId(testHoca.getId()).get(0);
        Student student = studentRepository.findByAdvisorId(testHoca.getId()).get(0);

        AttendanceEntryRequest request = AttendanceEntryRequest.builder()
                .attendanceDate(LocalDate.now())
                .attendance(List.of(AttendanceEntryRequest.StudentAttendanceDTO.builder()
                        .studentId(student.getId()).isPresent(true).build()))
                .build();

        mockMvc.perform(post("/api/academician/courses/" + course.getId() + "/attendance")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());

        Assertions.assertFalse(attendanceRecordRepository.findByEnrollmentCourseIdAndAttendanceDate(course.getId(), LocalDate.now()).isEmpty());
    }

    @Test
    @Order(10)
    @DisplayName("Should open course")
    void shouldOpenCourse() throws Exception {
        Course course = courseRepository.findByInstructorId(testHoca.getId()).get(0);
        
        // Satisfy Phase 4 Rules: Syllabus + 100% Exams
        course.setSyllabus("Phase 4 Syllabus");
        courseRepository.save(course);
        
        examRepository.save(Exam.builder()
                .examType(ExamType.FINAL).examDate(LocalDateTime.now().plusDays(30)).ratio(100.0)
                .course(course).classroom(testClassroom).semester(testSemester).build());

        CourseOpenRequest request = CourseOpenRequest.builder().quota(30).build();

        mockMvc.perform(put("/api/academician/courses/" + course.getId() + "/open")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());

        Course updated = courseRepository.findById(course.getId()).orElseThrow();
        Assertions.assertTrue(updated.isOpen());
        Assertions.assertEquals(30, updated.getQuota());
    }

    @Test
    @Order(11)
    @DisplayName("Should send message to advisee")
    void shouldSendMessage() throws Exception {
        Student student = studentRepository.findByAdvisorId(testHoca.getId()).get(0);
        AdviseeMessageRequest request = AdviseeMessageRequest.builder().content("Hello Advisee").build();

        mockMvc.perform(post("/api/academician/advisees/" + student.getId() + "/message")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());
    }

    @Test
    @Order(12)
    @DisplayName("Should manage advisor approvals")
    void shouldManageApprovals() throws Exception {
        // Create a PENDING enrollment
        Course course = courseRepository.findByInstructorId(testHoca.getId()).get(0);
        Student student = studentRepository.findByAdvisorId(testHoca.getId()).get(0);
        Enrollment pending = enrollmentRepository.save(Enrollment.builder()
                .course(course).student(student).semester(testSemester).status(EnrollmentStatus.PENDING).build());

        // 1. List pending
        mockMvc.perform(get("/api/academician/advisees/enrollments/pending"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.id == " + pending.getId() + ")]").exists());

        // 2. Approve
        mockMvc.perform(put("/api/academician/enrollments/" + pending.getId() + "/approve"))
                .andExpect(status().isOk());

        Enrollment approved = enrollmentRepository.findById(pending.getId()).orElseThrow();
        Assertions.assertEquals(EnrollmentStatus.APPROVED, approved.getStatus());
    }

    @Test
    @Order(13)
    @DisplayName("Should deny grading for pending enrollment")
    void shouldDenyGradingForPending() throws Exception {
        Course course = courseRepository.findByInstructorId(testHoca.getId()).get(0);
        Student student = studentRepository.findByAdvisorId(testHoca.getId()).get(0);
        
        // Update existing enrollment to PENDING
        Enrollment enrollment = enrollmentRepository.findByCourseIdAndStudentId(course.getId(), student.getId()).orElseThrow();
        enrollment.setStatus(EnrollmentStatus.PENDING);
        enrollmentRepository.save(enrollment);

        Exam midterm = examRepository.save(Exam.builder()
                .examType(ExamType.MIDTERM).examDate(LocalDateTime.now()).ratio(40.0)
                .course(course).classroom(testClassroom).semester(testSemester).build());

        GradeEntryRequest request = GradeEntryRequest.builder()
                .grades(List.of(GradeEntryRequest.StudentGradeDTO.builder().studentId(student.getId()).score(100.0).build()))
                .build();

        // Should return 400 (Validation Error) as per service logic
        mockMvc.perform(post("/api/academician/exams/" + midterm.getId() + "/grades")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @Order(14)
    @DisplayName("Should post and get announcements")
    void shouldManageAnnouncements() throws Exception {
        Course course = courseRepository.findByInstructorId(testHoca.getId()).get(0);
        AnnouncementRequest request = AnnouncementRequest.builder()
                .title("Exam Date Change")
                .content("Midterm is moved to Friday.")
                .build();

        mockMvc.perform(post("/api/academician/courses/" + course.getId() + "/announcements")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/academician/courses/" + course.getId() + "/announcements"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].title").value("Exam Date Change"));
    }

    @Test
    @Order(15)
    @DisplayName("Should manage office hours")
    void shouldManageOfficeHours() throws Exception {
        OfficeHourRequest request = OfficeHourRequest.builder()
                .dayOfWeek(java.time.DayOfWeek.MONDAY)
                .startTime(java.time.LocalTime.of(14, 0))
                .endTime(java.time.LocalTime.of(16, 0))
                .build();

        mockMvc.perform(post("/api/academician/office-hours")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(List.of(request))))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/academician/office-hours"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].dayOfWeek").value("MONDAY"));
    }

    @Test
    @Order(16)
    @DisplayName("Should get course analytics")
    void shouldGetAnalytics() throws Exception {
        Course course = courseRepository.findByInstructorId(testHoca.getId()).get(0);
        
        mockMvc.perform(get("/api/academician/courses/" + course.getId() + "/analytics"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.passRate").exists());
    }

    @Test
    @Order(17)
    @DisplayName("Should deny opening course without syllabus")
    void shouldDenyOpeningWithoutSyllabus() throws Exception {
        Course course = courseRepository.save(Course.builder()
                .code("ERR101").name("Error Course").akts(5).credits(3)
                .department(courseRepository.findAll().get(0).getDepartment())
                .instructor(testHoca).build());
        
        CourseOpenRequest request = CourseOpenRequest.builder().quota(50).build();
        
        mockMvc.perform(put("/api/academician/courses/" + course.getId() + "/open")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.description").value("Cannot open course without a syllabus"));
    }

    @Test
    @Order(18)
    @DisplayName("Should deny opening course if AKTS limit exceeded")
    void shouldDenyOpeningIfAktsExceeded() throws Exception {
        // Current load is 5 AKTS (from setup course). Opening 30 more should fail.
        Course heavyCourse = courseRepository.save(Course.builder()
                .code("BIG101").name("Heavy Course").akts(31).credits(3)
                .department(courseRepository.findAll().get(0).getDepartment())
                .instructor(testHoca).syllabus("Some syllabus").build());

        CourseOpenRequest request = CourseOpenRequest.builder().quota(50).build();

        mockMvc.perform(put("/api/academician/courses/" + heavyCourse.getId() + "/open")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.description").value(org.hamcrest.Matchers.containsString("Total AKTS load exceeds limit")));
    }

    @Test
    @Order(19)
    @DisplayName("Should export grades and advisees")
    void shouldExportData() throws Exception {
        Course course = courseRepository.findByInstructorId(testHoca.getId()).get(0);
        
        mockMvc.perform(get("/api/academician/courses/" + course.getId() + "/export-grades"))
                .andExpect(status().isOk())
                .andExpect(content().contentType("text/csv;charset=UTF-8"));

        mockMvc.perform(get("/api/academician/advisees/export"))
                .andExpect(status().isOk())
                .andExpect(content().contentType("text/csv;charset=UTF-8"));
    }

    private void login(String username) {
        UserDetails userDetails = userDetailsService.loadUserByUsername(username);
        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
        SecurityContextHolder.getContext().setAuthentication(auth);
    }
}
