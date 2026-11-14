package com.obs.backend.registration;

import com.obs.backend.model.*;
import com.obs.backend.model.enums.EnrollmentStatus;
import com.obs.backend.repository.EnrollmentRepository;
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

import java.time.LocalDate;

import static org.hamcrest.Matchers.contains;
import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Plan 2.4: only a failing, finalized grade from an earlier semester makes a course mandatory. */
@Transactional
class MandatoryRetakeIntegrationTest extends AbstractIntegrationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private TestDataFactory data;
    @Autowired private AuthHelper auth;
    @Autowired private EnrollmentRepository enrollmentRepository;

    private Course math;
    private Course physics;
    private Semester active;
    private Semester lastYear;
    private Student student;

    @BeforeEach
    void setUp() {
        Department department = data.department();
        Academician instructor = data.academician(department);
        math = data.course(department, instructor);
        physics = data.course(department, instructor);
        active = data.activeSemester();
        lastYear = data.pastSemester(LocalDate.now().minusYears(1));
        student = data.student(department, instructor);
    }

    private ResultActions mandatoryFlagOf(Course course, boolean expected) throws Exception {
        return mockMvc.perform(get("/api/student/registration/available-courses").with(auth.as(student)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.id == " + course.getId() + ")].mandatory").value(contains(expected)));
    }

    private ResultActions enroll(Course... courses) throws Exception {
        StringBuilder ids = new StringBuilder();
        for (Course c : courses) {
            if (ids.length() > 0) ids.append(',');
            ids.append(c.getId());
        }
        return mockMvc.perform(post("/api/student/registration/enroll").with(auth.as(student))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"courseIds\":[" + ids + "]}"));
    }

    @Test
    void aFailFromAnEarlierSemesterIsMandatory() throws Exception {
        data.finalizedEnrollment(student, math, lastYear, "FF");

        mandatoryFlagOf(math, true);
        mandatoryFlagOf(physics, false);

        enroll(physics)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.description", containsString(math.getCode())));
        enroll(physics, math).andExpect(status().isOk());
    }

    @Test
    void aFailInTheActiveSemesterIsNotMandatory() throws Exception {
        data.finalizedEnrollment(student, math, active, "FF");

        mandatoryFlagOf(math, false);
        enroll(physics).andExpect(status().isOk());
    }

    @Test
    void aLaterPassRemovesTheObligation() throws Exception {
        data.finalizedEnrollment(student, math, data.pastSemester(LocalDate.now().minusYears(2)), "FF");
        data.finalizedEnrollment(student, math, lastYear, "CC");

        mandatoryFlagOf(math, false);
        enroll(physics).andExpect(status().isOk());
    }

    @Test
    void aLaterFailKeepsItMandatoryAfterAnEarlierPass() throws Exception {
        data.finalizedEnrollment(student, math, data.pastSemester(LocalDate.now().minusYears(2)), "CC");
        data.finalizedEnrollment(student, math, lastYear, "FF");

        mandatoryFlagOf(math, true);
    }

    @Test
    void anUnfinalizedOrUnapprovedFailDoesNotCount() throws Exception {
        enrollmentRepository.save(Enrollment.builder()
                .student(student).course(math).semester(lastYear)
                .status(EnrollmentStatus.APPROVED).grade("FF")
                .build());
        enrollmentRepository.save(Enrollment.builder()
                .student(student).course(physics).semester(lastYear)
                .status(EnrollmentStatus.REJECTED).grade("FF").gradeFinalizedAt(java.time.LocalDateTime.now())
                .build());

        mandatoryFlagOf(math, false);
        mandatoryFlagOf(physics, false);
    }

    @Test
    void aFailAlreadyReRegisteredThisSemesterIsSatisfied() throws Exception {
        data.finalizedEnrollment(student, math, lastYear, "FF");
        data.enrollment(student, math, active, EnrollmentStatus.PENDING);

        enroll(physics).andExpect(status().isOk());
    }
}
