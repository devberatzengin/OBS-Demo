package com.obs.backend.performance;

import com.obs.backend.model.*;
import com.obs.backend.model.enums.EnrollmentStatus;
import com.obs.backend.repository.AttendanceRecordRepository;
import com.obs.backend.repository.CourseRepository;
import com.obs.backend.support.AbstractIntegrationTest;
import com.obs.backend.support.AuthHelper;
import com.obs.backend.support.QueryCounter;
import com.obs.backend.support.TestDataFactory;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Plan 4.3: the number of SQL statements behind a screen must not grow with the number of rows.
 * Each test measures a screen with a few rows, adds more rows, and measures again: an N+1 shows up
 * as a higher second count. No absolute numbers, so unrelated changes do not break these tests.
 */
@Transactional
class NPlusOneIntegrationTest extends AbstractIntegrationTest {

    private static final int FEW = 2;
    private static final int MORE = 8;

    @Autowired private MockMvc mockMvc;
    @Autowired private TestDataFactory data;
    @Autowired private AuthHelper auth;
    @Autowired private QueryCounter queries;
    @Autowired private CourseRepository courseRepository;
    @Autowired private AttendanceRecordRepository attendanceRecordRepository;

    private Department department;
    private Academician instructor;
    private Semester active;
    private Student student;

    @BeforeEach
    void setUp() {
        department = data.department();
        instructor = data.academician(department);
        active = data.activeSemester();
        student = data.student(department, instructor);
    }

    private long statementsFor(User caller, MockHttpServletRequestBuilder request) throws Exception {
        return queries.count(() -> mockMvc.perform(request.with(auth.as(caller))).andExpect(status().isOk()));
    }

    /** One finalized course per earlier semester, each in its own course and semester. */
    private void addFinalizedHistory(int courses) {
        for (int i = 0; i < courses; i++) {
            Course course = data.course(department, instructor);
            Semester past = data.pastSemester(LocalDate.now().minusYears(1).minusMonths(i));
            data.finalizedEnrollment(student, course, past, "BB");
        }
    }

    @Test
    void transcript() throws Exception {
        addFinalizedHistory(FEW);
        long few = statementsFor(student, get("/api/student/transcript"));

        addFinalizedHistory(MORE);
        long more = statementsFor(student, get("/api/student/transcript"));

        assertThat(more).as("statements with %d vs %d courses", FEW + MORE, FEW).isEqualTo(few);
    }

    private void addAdvisees(int count) {
        for (int i = 0; i < count; i++) {
            // A department each, so a lazy department would cost one query per student
            data.student(data.department(), instructor);
        }
    }

    @Test
    void adviseeLists() throws Exception {
        addAdvisees(FEW);
        long fewPerformance = statementsFor(instructor, get("/api/academician/advisees/performance"));
        long fewList = statementsFor(instructor, get("/api/academician/advisees"));

        addAdvisees(MORE);
        assertThat(statementsFor(instructor, get("/api/academician/advisees/performance"))).isEqualTo(fewPerformance);
        assertThat(statementsFor(instructor, get("/api/academician/advisees"))).isEqualTo(fewList);
    }

    private void addStudentsToCourse(Course course, int count) {
        for (int i = 0; i < count; i++) {
            Student s = data.student(data.department(), instructor);
            Enrollment e = data.enrollment(s, course, active, EnrollmentStatus.APPROVED);
            attendanceRecordRepository.save(AttendanceRecord.builder()
                    .enrollment(e).attendanceDate(LocalDate.now().minusDays(1)).isPresent(i % 2 == 0).build());
        }
    }

    @Test
    void courseStudentList() throws Exception {
        Course course = data.course(department, instructor);
        addStudentsToCourse(course, FEW);
        long few = statementsFor(instructor, get("/api/academician/courses/" + course.getId() + "/students"));

        addStudentsToCourse(course, MORE);
        long more = statementsFor(instructor, get("/api/academician/courses/" + course.getId() + "/students"));

        assertThat(more).isEqualTo(few);
    }

    @Test
    void courseStudentListShowsOnlyThisSemester() throws Exception {
        Course course = data.course(department, instructor);
        data.finalizedEnrollment(student, course, data.pastSemester(LocalDate.now().minusYears(1)), "FF");
        Student current = data.student(department, instructor);
        data.enrollment(current, course, active, EnrollmentStatus.APPROVED);

        String body = mockMvc.perform(get("/api/academician/courses/" + course.getId() + "/students").with(auth.as(instructor)))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();

        assertThat(body).contains("\"id\":" + current.getId()).doesNotContain("\"id\":" + student.getId() + ",");
    }

    private void addOpenCoursesWithQuota(int count) {
        for (int i = 0; i < count; i++) {
            // Each with its own instructor (a lazy instructor would cost one query per course)
            Course course = data.course(department, data.academician(department));
            course.setQuota(40);
            courseRepository.save(course);
            data.enrollment(data.student(department, instructor), course, active, EnrollmentStatus.PENDING);
        }
    }

    @Test
    void registrationScreen() throws Exception {
        addOpenCoursesWithQuota(FEW);
        long few = statementsFor(student, get("/api/student/registration/available-courses"));

        addOpenCoursesWithQuota(MORE);
        long more = statementsFor(student, get("/api/student/registration/available-courses"));

        assertThat(more).isEqualTo(few);
    }

    private void addPendingRequests(int count) {
        for (int i = 0; i < count; i++) {
            Student s = data.student(department, instructor);
            data.enrollment(s, data.course(department, instructor), active, EnrollmentStatus.PENDING);
        }
    }

    @Test
    void pendingRequests() throws Exception {
        addPendingRequests(FEW);
        long few = statementsFor(instructor, get("/api/academician/advisees/enrollments/pending"));

        addPendingRequests(MORE);
        long more = statementsFor(instructor, get("/api/academician/advisees/enrollments/pending"));

        assertThat(more).isEqualTo(few);
    }

    private void addLessons(int count) {
        for (int i = 0; i < count; i++) {
            Course course = data.course(department, instructor);
            data.schedule(course, DayOfWeek.MONDAY, "09:00", "10:00");
            data.enrollment(data.student(department, instructor), course, active, EnrollmentStatus.APPROVED);
        }
    }

    @Test
    void weeklySchedule() throws Exception {
        addLessons(FEW);
        long few = statementsFor(instructor, get("/api/academician/schedule"));

        addLessons(MORE);
        long more = statementsFor(instructor, get("/api/academician/schedule"));

        assertThat(more).isEqualTo(few);
    }
}
