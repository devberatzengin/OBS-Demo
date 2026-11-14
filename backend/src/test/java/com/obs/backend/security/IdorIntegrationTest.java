package com.obs.backend.security;

import com.obs.backend.model.*;
import com.obs.backend.model.enums.EnrollmentStatus;
import com.obs.backend.model.enums.ExamType;
import com.obs.backend.repository.ChatMessageRepository;
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
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Plan 4.1: callers with the right role still cannot reach other people's data by changing an id
 * (insecure direct object reference). Course-level checks are in CourseOwnershipIntegrationTest.
 */
@Transactional
class IdorIntegrationTest extends AbstractIntegrationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private TestDataFactory data;
    @Autowired private AuthHelper auth;
    @Autowired private ExamRepository examRepository;
    @Autowired private EnrollmentRepository enrollmentRepository;
    @Autowired private ChatMessageRepository chatMessageRepository;

    private Academician owner;
    private Academician otherInstructor;
    private Student student;
    private Semester active;
    private Course course;
    private Exam exam;

    @BeforeEach
    void setUp() {
        Department department = data.department();
        owner = data.academician(department);
        otherInstructor = data.academician(department);
        active = data.activeSemester();
        course = data.course(department, owner);
        exam = data.exam(course, active, ExamType.MIDTERM, 40);
        student = data.student(department, owner);
        data.enrollment(student, course, active, EnrollmentStatus.APPROVED);
    }

    @Test
    void anotherInstructorCannotTouchTheExam() throws Exception {
        String examJson = "{\"examType\":\"MIDTERM\",\"examDate\":\"2026-12-01T10:00:00\",\"ratio\":10,"
                + "\"classroomId\":" + data.classroom().getId() + "}";

        mockMvc.perform(put("/api/academician/exams/" + exam.getId()).with(auth.as(otherInstructor))
                        .contentType(MediaType.APPLICATION_JSON).content(examJson))
                .andExpect(status().isForbidden());
        mockMvc.perform(delete("/api/academician/exams/" + exam.getId()).with(auth.as(otherInstructor)))
                .andExpect(status().isForbidden());
        mockMvc.perform(get("/api/academician/exams/" + exam.getId() + "/grades").with(auth.as(otherInstructor)))
                .andExpect(status().isForbidden());
        mockMvc.perform(post("/api/academician/exams/" + exam.getId() + "/grades").with(auth.as(otherInstructor))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"grades\":[{\"studentId\":" + student.getId() + ",\"score\":100}]}"))
                .andExpect(status().isForbidden());
        mockMvc.perform(post("/api/academician/courses/" + course.getId() + "/finalize-grades").with(auth.as(otherInstructor)))
                .andExpect(status().isForbidden());

        Exam stored = examRepository.findById(exam.getId()).orElseThrow();
        assertThat(stored.getRatio()).isEqualTo(40.0);
    }

    @Test
    void anotherAdvisorCannotApproveOrRejectTheRequest() throws Exception {
        Course other = data.course(course.getDepartment(), owner);
        Enrollment request = data.enrollment(student, other, active, EnrollmentStatus.PENDING);

        mockMvc.perform(put("/api/academician/enrollments/" + request.getId() + "/approve").with(auth.as(otherInstructor)))
                .andExpect(status().isForbidden());
        mockMvc.perform(put("/api/academician/enrollments/" + request.getId() + "/reject").with(auth.as(otherInstructor)))
                .andExpect(status().isForbidden());

        assertThat(enrollmentRepository.findById(request.getId()))
                .hasValueSatisfying(e -> assertThat(e.getStatus()).isEqualTo(EnrollmentStatus.PENDING));
    }

    @Test
    void aThirdPersonCannotReadAConversation() throws Exception {
        Student other = data.student(course.getDepartment(), owner);
        chatMessageRepository.save(ChatMessage.builder()
                .sender(student).receiver(owner).content("Private question").timestamp(LocalDateTime.now()).build());

        // The URL names one side of the conversation, but the history is always the caller's own
        mockMvc.perform(get("/api/chat/messages/" + owner.getId()).with(auth.as(other)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));
        mockMvc.perform(get("/api/chat/messages/" + student.getId()).with(auth.as(other)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));
        mockMvc.perform(get("/api/chat/messages/" + owner.getId()).with(auth.as(student)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)));
    }
}
