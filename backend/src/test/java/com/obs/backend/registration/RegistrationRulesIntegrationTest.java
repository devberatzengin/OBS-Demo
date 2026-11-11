package com.obs.backend.registration;

import com.obs.backend.model.*;
import com.obs.backend.model.enums.EnrollmentStatus;
import com.obs.backend.repository.CourseRepository;
import com.obs.backend.repository.EnrollmentRepository;
import com.obs.backend.repository.SemesterRepository;
import com.obs.backend.support.AbstractIntegrationTest;
import com.obs.backend.support.AuthHelper;
import com.obs.backend.support.TestDataFactory;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.Arrays;
import java.util.stream.Collectors;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.contains;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.empty;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Plan 3.1: one rule set for both registration endpoints, each rule with its own error code. */
@Transactional
class RegistrationRulesIntegrationTest extends AbstractIntegrationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private TestDataFactory data;
    @Autowired private AuthHelper auth;
    @Autowired private CourseRepository courseRepository;
    @Autowired private SemesterRepository semesterRepository;
    @Autowired private EnrollmentRepository enrollmentRepository;

    private Department department;
    private Academician instructor;
    private Semester active;
    private Student student;
    private Course math;
    private Course physics;

    @BeforeEach
    void setUp() {
        department = data.department();
        instructor = data.academician(department);
        active = data.activeSemester();
        student = data.student(department, instructor);
        math = data.course(department, instructor);
        physics = data.course(department, instructor);
    }

    private ResultActions enroll(Course... courses) throws Exception {
        String ids = Arrays.stream(courses).map(c -> String.valueOf(c.getId())).collect(Collectors.joining(","));
        return mockMvc.perform(post("/api/student/registration/enroll").with(auth.as(student))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"courseIds\":[" + ids + "]}"));
    }

    private ResultActions registerSingle(Course course) throws Exception {
        return mockMvc.perform(post("/api/student/register-course/" + course.getId()).with(auth.as(student)));
    }

    private ResultActions available() throws Exception {
        return mockMvc.perform(get("/api/student/registration/available-courses").with(auth.as(student)))
                .andExpect(status().isOk());
    }

    private Course save(Course course) {
        return courseRepository.save(course);
    }

    @Test
    void aValidRegistrationIsPending() throws Exception {
        enroll(math, physics).andExpect(status().isOk());

        assertThat(enrollmentRepository.findByStudentIdAndSemesterId(student.getId(), active.getId()))
                .hasSize(2)
                .allSatisfy(e -> assertThat(e.getStatus()).isEqualTo(EnrollmentStatus.PENDING));
    }

    @Test
    void registrationOutsideThePeriodIsClosed() throws Exception {
        active.setRegistrationEndDate(LocalDate.now().minusDays(1));
        semesterRepository.save(active);

        enroll(math).andExpect(status().isConflict()).andExpect(jsonPath("$.errorCode").value("OBS-101"));
        registerSingle(math).andExpect(status().isConflict()).andExpect(jsonPath("$.errorCode").value("OBS-101"));

        active.setRegistrationEndDate(null);
        active.setRegistrationStartDate(LocalDate.now().plusDays(3));
        semesterRepository.save(active);
        enroll(math).andExpect(status().isConflict());

        // Decision K9: no dates means open
        active.setRegistrationStartDate(null);
        semesterRepository.save(active);
        enroll(math).andExpect(status().isOk());
    }

    @Test
    void aClosedCourseCannotBeRegistered() throws Exception {
        math.setOpen(false);
        save(math);

        enroll(math).andExpect(status().isBadRequest()).andExpect(jsonPath("$.errorCode").value("OBS-102"));
        available().andExpect(jsonPath("$[?(@.id == " + math.getId() + ")]").value(empty()));
    }

    @Test
    void aCourseOfAnotherDepartmentCannotBeRegistered() throws Exception {
        Course foreign = data.course(data.department(), instructor);

        enroll(foreign).andExpect(status().isBadRequest()).andExpect(jsonPath("$.errorCode").value("OBS-103"));
    }

    @Test
    void registeringTwiceIsAConflict() throws Exception {
        registerSingle(math).andExpect(status().isOk());

        registerSingle(math).andExpect(status().isConflict()).andExpect(jsonPath("$.errorCode").value("OBS-104"));
        enroll(math).andExpect(status().isConflict()).andExpect(jsonPath("$.errorCode").value("OBS-104"));
        enroll(physics, physics).andExpect(status().isConflict()).andExpect(jsonPath("$.errorCode").value("OBS-104"));
    }

    @Test
    void aRejectedRequestCanBeSentAgain() throws Exception {
        Enrollment rejected = data.enrollment(student, math, active, EnrollmentStatus.REJECTED);

        enroll(math).andExpect(status().isOk());

        assertThat(enrollmentRepository.findByStudentIdAndSemesterId(student.getId(), active.getId()))
                .singleElement()
                .satisfies(e -> {
                    assertThat(e.getId()).isEqualTo(rejected.getId());
                    assertThat(e.getStatus()).isEqualTo(EnrollmentStatus.PENDING);
                });
    }

    @Test
    void aPassedCourseIsClosedExceptDdAndDc() throws Exception {
        Semester lastYear = data.pastSemester(LocalDate.now().minusYears(1));
        data.finalizedEnrollment(student, math, lastYear, "CC");
        data.finalizedEnrollment(student, physics, lastYear, "DD");

        enroll(math).andExpect(status().isBadRequest()).andExpect(jsonPath("$.errorCode").value("OBS-105"));
        available()
                .andExpect(jsonPath("$[?(@.id == " + math.getId() + ")].passed").value(contains(true)))
                .andExpect(jsonPath("$[?(@.id == " + physics.getId() + ")].passed").value(contains(false)));

        // Decision K7: DD may be raised by taking the course again
        enroll(physics).andExpect(status().isOk());
    }

    @Test
    void aMissingRetakeHasItsOwnCode() throws Exception {
        data.finalizedEnrollment(student, math, data.pastSemester(LocalDate.now().minusYears(1)), "FF");

        registerSingle(physics).andExpect(status().isBadRequest()).andExpect(jsonPath("$.errorCode").value("OBS-106"));
        registerSingle(math).andExpect(status().isOk());
        registerSingle(physics).andExpect(status().isOk());
    }

    @Test
    void theAktsLimitCountsCoursesAlreadyRegistered() throws Exception {
        math.setAkts(26);
        save(math);
        registerSingle(math).andExpect(status().isOk());

        // 26 + 5 = 31 > 30, even though physics alone is only 5
        registerSingle(physics)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCode").value("OBS-107"))
                .andExpect(jsonPath("$.description", containsString("31")));
    }

    @Test
    void aScheduleConflictWithARegisteredCourseIsRejected() throws Exception {
        data.schedule(math, DayOfWeek.MONDAY, "09:00", "11:00");
        data.schedule(physics, DayOfWeek.MONDAY, "10:00", "12:00");
        registerSingle(math).andExpect(status().isOk());

        registerSingle(physics).andExpect(status().isBadRequest()).andExpect(jsonPath("$.errorCode").value("OBS-108"));
    }

    @Test
    void back2BackLessonsDoNotConflict() throws Exception {
        data.schedule(math, DayOfWeek.MONDAY, "09:00", "11:00");
        data.schedule(physics, DayOfWeek.MONDAY, "11:00", "12:00");

        enroll(math, physics).andExpect(status().isOk());
    }

    @Test
    void aFullCourseIsRejectedAndPendingRequestsHoldPlaces() throws Exception {
        math.setQuota(1);
        save(math);
        Student other = data.student(department, instructor);
        data.enrollment(other, math, active, EnrollmentStatus.PENDING);

        enroll(math).andExpect(status().isConflict()).andExpect(jsonPath("$.errorCode").value("OBS-109"));
        available()
                .andExpect(jsonPath("$[?(@.id == " + math.getId() + ")].quota").value(contains(1)))
                .andExpect(jsonPath("$[?(@.id == " + math.getId() + ")].enrolledCount").value(contains(1)));
    }

    @Test
    void theAdvisorRejectingARequestFreesThePlace() throws Exception {
        math.setQuota(1);
        save(math);
        Student other = data.student(department, instructor);
        Enrollment request = data.enrollment(other, math, active, EnrollmentStatus.PENDING);
        enroll(math).andExpect(status().isConflict());

        mockMvc.perform(put("/api/academician/enrollments/" + request.getId() + "/reject").with(auth.as(instructor)))
                .andExpect(status().isOk());

        enroll(math).andExpect(status().isOk());
    }

    @Test
    void anApprovedEnrollmentCannotBeRejected() throws Exception {
        Enrollment approved = data.enrollment(student, math, active, EnrollmentStatus.APPROVED);

        mockMvc.perform(put("/api/academician/enrollments/" + approved.getId() + "/reject").with(auth.as(instructor)))
                .andExpect(status().isConflict());
        assertThat(enrollmentRepository.findById(approved.getId())).isPresent();
    }

    @Test
    void aZeroQuotaMeansUnlimited() throws Exception {
        math.setQuota(0);
        save(math);

        enroll(math).andExpect(status().isOk());
        assertThat(enrollmentRepository.findByStudentIdAndSemesterId(student.getId(), active.getId())).hasSize(1);
    }

    @Test
    void bothEndpointsGiveTheSameAnswer() throws Exception {
        math.setOpen(false);
        save(math);

        String batch = enroll(math).andReturn().getResponse().getContentAsString();
        String single = registerSingle(math).andReturn().getResponse().getContentAsString();

        assertThat(single).contains("\"errorCode\":\"OBS-102\"");
        assertThat(batch).contains("\"errorCode\":\"OBS-102\"");
    }

    @Test
    void anEmptyRequestIsInvalid() throws Exception {
        mockMvc.perform(post("/api/student/registration/enroll").with(auth.as(student))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"courseIds\":[]}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCode").value("OBS-001"));
    }
}
