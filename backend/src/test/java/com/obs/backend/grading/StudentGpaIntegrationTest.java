package com.obs.backend.grading;

import com.obs.backend.model.*;
import com.obs.backend.model.enums.EnrollmentStatus;
import com.obs.backend.model.enums.ExamType;
import com.obs.backend.repository.StudentRepository;
import com.obs.backend.support.AbstractIntegrationTest;
import com.obs.backend.support.AuthHelper;
import com.obs.backend.support.TestDataFactory;
import com.jayway.jsonpath.JsonPath;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.within;
import static org.hamcrest.Matchers.nullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Plan 2.3 (decision K2): the stored GPA is recomputed on finalize and always equals the transcript GNO. */
@Transactional
class StudentGpaIntegrationTest extends AbstractIntegrationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private TestDataFactory data;
    @Autowired private AuthHelper auth;
    @Autowired private StudentRepository studentRepository;

    private Department department;
    private Academician instructor;
    private Course course;
    private Semester active;
    private Exam midterm;
    private Exam finalExam;
    private Student ali;

    @BeforeEach
    void setUp() {
        department = data.department();
        instructor = data.academician(department);
        course = data.course(department, instructor);
        active = data.activeSemester();
        midterm = data.exam(course, active, ExamType.MIDTERM, 40);
        finalExam = data.exam(course, active, ExamType.FINAL, 60);
        ali = data.student(department, instructor);
        data.enrollment(ali, course, active, EnrollmentStatus.APPROVED);
    }

    private void enter(Exam exam, Student student, double score) throws Exception {
        mockMvc.perform(post("/api/academician/exams/" + exam.getId() + "/grades").with(auth.as(instructor))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"grades\":[{\"studentId\":" + student.getId() + ",\"score\":" + score + "}]}"))
                .andExpect(status().isOk());
    }

    private void finalizeCourse() throws Exception {
        mockMvc.perform(post("/api/academician/courses/" + course.getId() + "/finalize-grades").with(auth.as(instructor)))
                .andExpect(status().isOk());
    }

    private Double dashboardGpa(Student student) throws Exception {
        String body = mockMvc.perform(get("/api/student/dashboard").with(auth.as(student)))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        return toDouble(JsonPath.read(body, "$.gpa"));
    }

    private Double transcriptGpa(Student student) throws Exception {
        String body = mockMvc.perform(get("/api/student/transcript").with(auth.as(student)))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        return toDouble(JsonPath.read(body, "$.cumulativeGpa"));
    }

    private static Double toDouble(Object value) {
        return value == null ? null : ((Number) value).doubleValue();
    }

    private Double storedGpa(Student student) {
        return studentRepository.findById(student.getId()).orElseThrow().getGpa();
    }

    @Test
    void aStudentWithoutFinalizedGradesHasNoGpa() throws Exception {
        mockMvc.perform(get("/api/student/dashboard").with(auth.as(ali)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.gpa").value(nullValue()));
        assertThat(transcriptGpa(ali)).isNull();
        assertThat(storedGpa(ali)).isNull();
    }

    @Test
    void finalizingStoresTheSameGpaAsTheTranscript() throws Exception {
        // History: an FF in another 5-ECTS course from last year
        Course physics = data.course(department, instructor);
        data.finalizedEnrollment(ali, physics, data.pastSemester(LocalDate.now().minusYears(1)), "FF");

        enter(midterm, ali, 80);    // 80*0.4 + 90*0.6 = 86 -> BA (3.5)
        enter(finalExam, ali, 90);
        finalizeCourse();

        // (0.0*5 + 3.5*5) / 10
        assertThat(storedGpa(ali)).isCloseTo(1.75, within(1e-9));
        assertThat(dashboardGpa(ali)).isCloseTo(1.75, within(1e-9));
        assertThat(transcriptGpa(ali)).isEqualTo(dashboardGpa(ali));
    }

    @Test
    void aRetakeReplacesTheEarlierAttempt() throws Exception {
        // Ali failed this very course last year and is retaking it now (decision K5: the last grade counts)
        data.finalizedEnrollment(ali, course, data.pastSemester(LocalDate.now().minusYears(1)), "FF");

        enter(midterm, ali, 80);
        enter(finalExam, ali, 90);
        finalizeCourse();

        assertThat(storedGpa(ali)).isCloseTo(3.5, within(1e-9));
        assertThat(transcriptGpa(ali)).isEqualTo(dashboardGpa(ali));
    }

    @Test
    void aCorrectionUpdatesTheStoredGpa() throws Exception {
        enter(midterm, ali, 40);    // 40*0.4 + 45*0.6 = 43 -> FF
        enter(finalExam, ali, 45);
        finalizeCourse();
        assertThat(storedGpa(ali)).isCloseTo(0.0, within(1e-9));

        // 40*0.4 + 70*0.6 = 58 -> FD (0.5)
        mockMvc.perform(post("/api/academician/exams/" + finalExam.getId() + "/grade-corrections").with(auth.as(instructor))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"studentId\":" + ali.getId() + ",\"score\":70,\"reason\":\"Re-evaluated after objection\"}"))
                .andExpect(status().isOk());

        assertThat(storedGpa(ali)).isCloseTo(0.5, within(1e-9));
        assertThat(transcriptGpa(ali)).isEqualTo(dashboardGpa(ali));
    }

    @Test
    void anAdvisorDoesNotSeeAStudentWithoutGpaAsAtRisk() throws Exception {
        mockMvc.perform(get("/api/academician/advisees/performance").with(auth.as(instructor)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].gpa").value(nullValue()))
                .andExpect(jsonPath("$[0].atRisk").value(false));
    }
}
