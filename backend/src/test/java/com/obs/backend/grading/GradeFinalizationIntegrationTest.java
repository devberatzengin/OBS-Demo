package com.obs.backend.grading;

import com.obs.backend.model.*;
import com.obs.backend.model.enums.EnrollmentStatus;
import com.obs.backend.model.enums.ExamType;
import com.obs.backend.repository.EnrollmentRepository;
import com.obs.backend.repository.SystemLogRepository;
import com.obs.backend.support.AbstractIntegrationTest;
import com.obs.backend.support.AuthHelper;
import com.obs.backend.support.TestDataFactory;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.allOf;
import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Plan 2.2 (decision K1): letters exist only after the instructor finalizes. */
@Transactional
class GradeFinalizationIntegrationTest extends AbstractIntegrationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private TestDataFactory data;
    @Autowired private AuthHelper auth;
    @Autowired private EnrollmentRepository enrollmentRepository;
    @Autowired private SystemLogRepository systemLogRepository;

    private Academician instructor;
    private Course course;
    private Exam midterm;
    private Exam finalExam;
    private Student ali;
    private Student ayse;
    private Enrollment aliEnrollment;
    private Enrollment ayseEnrollment;

    @BeforeEach
    void setUp() {
        Department department = data.department();
        instructor = data.academician(department);
        course = data.course(department, instructor);
        Semester semester = data.activeSemester();
        midterm = data.exam(course, semester, ExamType.MIDTERM, 40);
        finalExam = data.exam(course, semester, ExamType.FINAL, 60);
        ali = data.student(department, instructor);
        ayse = data.student(department, instructor);
        aliEnrollment = data.enrollment(ali, course, semester, EnrollmentStatus.APPROVED);
        ayseEnrollment = data.enrollment(ayse, course, semester, EnrollmentStatus.APPROVED);
    }

    private void enter(Exam exam, Student student, double score) throws Exception {
        mockMvc.perform(post("/api/academician/exams/" + exam.getId() + "/grades").with(auth.as(instructor))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"grades\":[{\"studentId\":" + student.getId() + ",\"score\":" + score + "}]}"))
                .andExpect(status().isOk());
    }

    private void enterAll() throws Exception {
        enter(midterm, ali, 80);    // 80*0.4 + 90*0.6 = 86 -> BA
        enter(finalExam, ali, 90);
        enter(midterm, ayse, 40);   // 40*0.4 + 45*0.6 = 43 -> FF
        enter(finalExam, ayse, 45);
    }

    private Enrollment reload(Enrollment e) {
        return enrollmentRepository.findById(e.getId()).orElseThrow();
    }

    @Test
    void aScoreAloneDoesNotAssignALetter() throws Exception {
        // Old behaviour: midterm 90 at 40% gave a running total of 36 and an FF immediately
        enter(midterm, ali, 90);

        Enrollment e = reload(aliEnrollment);
        assertThat(e.getScore()).isEqualTo(36.0);
        assertThat(e.getGrade()).isNull();
        assertThat(e.isGradeFinalized()).isFalse();
    }

    @Test
    void studentSeesTheCourseInProgressUntilFinalized() throws Exception {
        enter(midterm, ali, 90);

        mockMvc.perform(get("/api/student/transcript").with(auth.as(ali)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.semesters[0].courses[0].grade").doesNotExist())
                .andExpect(jsonPath("$.cumulativeGpa").doesNotExist());
    }

    @Test
    void finalizingWithMissingScoresListsThem() throws Exception {
        enter(midterm, ali, 80);
        enter(midterm, ayse, 40);
        enter(finalExam, ali, 90);

        mockMvc.perform(post("/api/academician/courses/" + course.getId() + "/finalize-grades").with(auth.as(instructor)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.description", allOf(containsString(ayse.getStudentNumber()), containsString("FINAL"))));

        assertThat(reload(aliEnrollment).isGradeFinalized()).isFalse();
    }

    @Test
    void finalizingAssignsLettersFromAllExams() throws Exception {
        enterAll();

        mockMvc.perform(post("/api/academician/courses/" + course.getId() + "/finalize-grades").with(auth.as(instructor)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.finalizedCount").value(2));

        assertThat(reload(aliEnrollment).getGrade()).isEqualTo("BA");
        assertThat(reload(ayseEnrollment).getGrade()).isEqualTo("FF");
        assertThat(reload(aliEnrollment).isGradeFinalized()).isTrue();

        mockMvc.perform(get("/api/academician/courses/" + course.getId() + "/analytics").with(auth.as(instructor)))
                .andExpect(jsonPath("$.gradesFinalized").value(true));
        mockMvc.perform(get("/api/student/transcript").with(auth.as(ali)))
                .andExpect(jsonPath("$.semesters[0].courses[0].grade").value("BA"));
    }

    @Test
    void examWeightsMustTotal100() throws Exception {
        Course other = data.course(data.department(), instructor);
        Semester active = midterm.getSemester();
        Exam onlyMidterm = data.exam(other, active, ExamType.MIDTERM, 40);
        data.enrollment(ali, other, active, EnrollmentStatus.APPROVED);
        enter(onlyMidterm, ali, 70);

        mockMvc.perform(post("/api/academician/courses/" + other.getId() + "/finalize-grades").with(auth.as(instructor)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.description", containsString("100%")));
    }

    @Test
    void finalizingTwiceIsAConflict() throws Exception {
        enterAll();
        mockMvc.perform(post("/api/academician/courses/" + course.getId() + "/finalize-grades").with(auth.as(instructor)))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/academician/courses/" + course.getId() + "/finalize-grades").with(auth.as(instructor)))
                .andExpect(status().isConflict());
    }

    @Test
    void normalGradeEntryIsLockedAfterFinalizing() throws Exception {
        enterAll();
        mockMvc.perform(post("/api/academician/courses/" + course.getId() + "/finalize-grades").with(auth.as(instructor)))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/academician/exams/" + finalExam.getId() + "/grades").with(auth.as(instructor))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"grades\":[{\"studentId\":" + ayse.getId() + ",\"score\":100}]}"))
                .andExpect(status().isConflict());

        assertThat(reload(ayseEnrollment).getGrade()).isEqualTo("FF");
    }

    @Test
    void correctionNeedsAReasonAndUpdatesTheLetter() throws Exception {
        enterAll();
        mockMvc.perform(post("/api/academician/courses/" + course.getId() + "/finalize-grades").with(auth.as(instructor)))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/academician/exams/" + finalExam.getId() + "/grade-corrections").with(auth.as(instructor))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"studentId\":" + ayse.getId() + ",\"score\":70,\"reason\":\"short\"}"))
                .andExpect(status().isBadRequest());
        assertThat(reload(ayseEnrollment).getGrade()).isEqualTo("FF");

        // 40*0.4 + 70*0.6 = 58 -> FD
        mockMvc.perform(post("/api/academician/exams/" + finalExam.getId() + "/grade-corrections").with(auth.as(instructor))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"studentId\":" + ayse.getId() + ",\"score\":70,\"reason\":\"Re-evaluated after objection\"}"))
                .andExpect(status().isOk());

        assertThat(reload(ayseEnrollment).getGrade()).isEqualTo("FD");
        assertThat(systemLogRepository.findAll())
                .anySatisfy(log -> {
                    assertThat(log.getAction()).isEqualTo("GRADE_CORRECTED");
                    assertThat(log.getDetails()).contains("FF -> FD").contains("Re-evaluated after objection");
                });
    }

    @Test
    void anotherAcademicianCannotFinalize() throws Exception {
        enterAll();
        Academician other = data.academician(data.department());

        mockMvc.perform(post("/api/academician/courses/" + course.getId() + "/finalize-grades").with(auth.as(other)))
                .andExpect(status().isForbidden());
    }
}
