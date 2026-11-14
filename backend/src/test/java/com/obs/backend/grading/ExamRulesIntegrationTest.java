package com.obs.backend.grading;

import com.obs.backend.model.*;
import com.obs.backend.model.enums.EnrollmentStatus;
import com.obs.backend.model.enums.ExamType;
import com.obs.backend.repository.EnrollmentRepository;
import com.obs.backend.repository.ExamRepository;
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

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.within;
import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Plan 2.5: exam weights, deletion and score range. */
@Transactional
class ExamRulesIntegrationTest extends AbstractIntegrationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private TestDataFactory data;
    @Autowired private AuthHelper auth;
    @Autowired private ExamRepository examRepository;
    @Autowired private EnrollmentRepository enrollmentRepository;

    private Academician instructor;
    private Course course;
    private Semester active;
    private Classroom classroom;
    private Student student;
    private Enrollment enrollment;

    @BeforeEach
    void setUp() {
        Department department = data.department();
        instructor = data.academician(department);
        course = data.course(department, instructor);
        active = data.activeSemester();
        classroom = data.classroom();
        student = data.student(department, instructor);
        enrollment = data.enrollment(student, course, active, EnrollmentStatus.APPROVED);
    }

    private String examJson(String type, Object ratio) {
        return "{\"examType\":\"" + type + "\",\"examDate\":\"2026-12-01T10:00:00\",\"ratio\":" + ratio
                + ",\"classroomId\":" + classroom.getId() + "}";
    }

    private ResultActions createExam(String type, Object ratio) throws Exception {
        return mockMvc.perform(post("/api/academician/courses/" + course.getId() + "/exams").with(auth.as(instructor))
                .contentType(MediaType.APPLICATION_JSON).content(examJson(type, ratio)));
    }

    private ResultActions updateExam(Exam exam, String type, Object ratio) throws Exception {
        return mockMvc.perform(put("/api/academician/exams/" + exam.getId()).with(auth.as(instructor))
                .contentType(MediaType.APPLICATION_JSON).content(examJson(type, ratio)));
    }

    private ResultActions enter(Exam exam, Object score) throws Exception {
        return mockMvc.perform(post("/api/academician/exams/" + exam.getId() + "/grades").with(auth.as(instructor))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"grades\":[{\"studentId\":" + student.getId() + ",\"score\":" + score + "}]}"));
    }

    @Test
    void weightsAbove100AreRejected() throws Exception {
        createExam("MIDTERM", 40).andExpect(status().isOk());
        createExam("FINAL", 70)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.description", containsString("110")));
        createExam("FINAL", 60).andExpect(status().isOk());

        assertThat(examRepository.findByCourseIdAndSemesterId(course.getId(), active.getId())).hasSize(2);
    }

    @Test
    void aWeightMustBeBetween0And100() throws Exception {
        createExam("QUIZ", 0).andExpect(status().isBadRequest());
        createExam("QUIZ", -10).andExpect(status().isBadRequest());
        createExam("QUIZ", 101).andExpect(status().isBadRequest());
        createExam("QUIZ", "null").andExpect(status().isBadRequest());
    }

    @Test
    void updatingAnExamDoesNotCountItsOwnWeightTwice() throws Exception {
        Exam midterm = data.exam(course, active, ExamType.MIDTERM, 40);
        data.exam(course, active, ExamType.FINAL, 60);

        updateExam(midterm, "MIDTERM", 40).andExpect(status().isOk());
        updateExam(midterm, "MIDTERM", 50).andExpect(status().isBadRequest());
    }

    @Test
    void changingAWeightRecalculatesTheRunningScore() throws Exception {
        Exam midterm = data.exam(course, active, ExamType.MIDTERM, 40);
        enter(midterm, 80).andExpect(status().isOk());
        assertThat(enrollmentRepository.findById(enrollment.getId()).orElseThrow().getScore()).isCloseTo(32.0, within(1e-9));

        updateExam(midterm, "MIDTERM", 50).andExpect(status().isOk());
        assertThat(enrollmentRepository.findById(enrollment.getId()).orElseThrow().getScore()).isCloseTo(40.0, within(1e-9));
    }

    @Test
    void anExamWithScoresCannotBeDeleted() throws Exception {
        Exam midterm = data.exam(course, active, ExamType.MIDTERM, 40);
        Exam quiz = data.exam(course, active, ExamType.QUIZ, 10);
        enter(midterm, 75).andExpect(status().isOk());

        mockMvc.perform(delete("/api/academician/exams/" + midterm.getId()).with(auth.as(instructor)))
                .andExpect(status().isConflict());
        mockMvc.perform(delete("/api/academician/exams/" + quiz.getId()).with(auth.as(instructor)))
                .andExpect(status().isOk());

        assertThat(examRepository.findById(midterm.getId())).isPresent();
        assertThat(examRepository.findById(quiz.getId())).isEmpty();
    }

    @Test
    void examsOfAFinalizedCourseAreFrozen() throws Exception {
        Exam midterm = data.exam(course, active, ExamType.MIDTERM, 40);
        Exam finalExam = data.exam(course, active, ExamType.FINAL, 60);
        enter(midterm, 80).andExpect(status().isOk());
        enter(finalExam, 90).andExpect(status().isOk());
        mockMvc.perform(post("/api/academician/courses/" + course.getId() + "/finalize-grades").with(auth.as(instructor)))
                .andExpect(status().isOk());

        updateExam(midterm, "MIDTERM", 30).andExpect(status().isConflict());
        createExam("QUIZ", 0.5).andExpect(status().isConflict());
        mockMvc.perform(delete("/api/academician/exams/" + finalExam.getId()).with(auth.as(instructor)))
                .andExpect(status().isConflict());
    }

    @Test
    void scoresOutsideTheRangeAreRejected() throws Exception {
        Exam midterm = data.exam(course, active, ExamType.MIDTERM, 40);

        enter(midterm, 101).andExpect(status().isBadRequest());
        enter(midterm, -1).andExpect(status().isBadRequest());
        enter(midterm, "null").andExpect(status().isBadRequest());
        enter(midterm, 100).andExpect(status().isOk());
    }
}
