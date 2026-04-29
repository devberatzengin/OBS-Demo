package com.obs.backend.integration;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.obs.backend.dto.registration.RegistrationRequest;
import com.obs.backend.dto.student.SimulationRequest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
public class StudentIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private com.obs.backend.repository.CourseRepository courseRepository;

    @Test
    @WithMockUser(username = "2024001", roles = "STUDENT")
    void shouldGetDashboardData() throws Exception {
        mockMvc.perform(get("/api/student/dashboard"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.studentNumber").value("2024001"))
                .andExpect(jsonPath("$.fullName", org.hamcrest.Matchers.containsString("Zengin")));
    }

    @Test
    @WithMockUser(username = "2024001", roles = "STUDENT")
    void shouldDetectCourseConflict() throws Exception {
        // Fetch dynamic IDs from DB
        Long courseId1 = courseRepository.findByCode("CSE201").get().getId();
        Long courseId2 = courseRepository.findByCode("CSE999").get().getId();
        Long mandatoryId = courseRepository.findByCode("MAT101").get().getId();

        RegistrationRequest request = RegistrationRequest.builder()
                .courseIds(List.of(courseId1, courseId2, mandatoryId))
                .build();

        mockMvc.perform(post("/api/student/registration/enroll")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.description", org.hamcrest.Matchers.containsString("conflict")));
    }

    @Test
    @WithMockUser(username = "2024001", roles = "STUDENT")
    void shouldCalculateTranscriptGpa() throws Exception {
        mockMvc.perform(get("/api/student/transcript"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.cumulativeGpa").exists());
    }

    @Test
    @WithMockUser(username = "2024001", roles = "STUDENT")
    void shouldSimulateHypotheticalGpa() throws Exception {
        SimulationRequest request = SimulationRequest.builder()
                .hypotheticalGrades(Map.of("CSE201", "AA"))
                .build();

        mockMvc.perform(post("/api/student/simulate-gpa")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(username = "2024001", roles = "STUDENT")
    void shouldGetAttendanceReport() throws Exception {
        mockMvc.perform(get("/api/student/attendance"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }
}
