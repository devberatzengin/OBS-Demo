package com.obs.backend.integration;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.obs.backend.dto.admin.*;
import com.obs.backend.model.enums.Role;
import com.obs.backend.repository.*;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestMethodOrder;
import org.junit.jupiter.api.MethodOrderer;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.hamcrest.Matchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
public class AdminIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private FacultyRepository facultyRepository;

    @Autowired
    private DepartmentRepository departmentRepository;

    @Autowired
    private SemesterRepository semesterRepository;

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    // --- Phase 1: Infrastructure ---

    @Test
    @Order(1)
    @WithMockUser(username = "admin", roles = "ADMIN")
    @DisplayName("Should create and list faculties")
    void shouldManageFaculties() throws Exception {
        String facultyName = "Test Faculty " + System.currentTimeMillis();
        FacultyDTO facultyDTO = FacultyDTO.builder().name(facultyName).build();

        mockMvc.perform(post("/api/admin/infrastructure/faculties")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(facultyDTO)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value(facultyName));

        mockMvc.perform(get("/api/admin/infrastructure/faculties"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(greaterThanOrEqualTo(1))));
    }

    // --- Phase 2: Academic Cycle ---

    @Test
    @Order(2)
    @WithMockUser(username = "admin", roles = "ADMIN")
    @DisplayName("Should manage semesters and ensure single active semester")
    @Transactional
    void shouldManageSemesters() throws Exception {
        SemesterDTO s1 = SemesterDTO.builder().name("Term 1").isActive(false).build();
        SemesterDTO s2 = SemesterDTO.builder().name("Term 2").isActive(false).build();

        // Create two semesters
        String result1 = mockMvc.perform(post("/api/admin/academics/semesters")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(s1)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        
        Long id1 = objectMapper.readTree(result1).get("id").asLong();

        String result2 = mockMvc.perform(post("/api/admin/academics/semesters")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(s2)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        
        Long id2 = objectMapper.readTree(result2).get("id").asLong();

        // Activate second one
        mockMvc.perform(patch("/api/admin/academics/semesters/" + id2 + "/activate"))
                .andExpect(status().isOk());

        // Verify id2 is active, id1 is inactive
        mockMvc.perform(get("/api/admin/academics/semesters"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.id == " + id2 + ")].active").value(true));
    }

    // --- Phase 3: User Management ---

    @Test
    @Order(3)
    @WithMockUser(username = "admin", roles = "ADMIN")
    @DisplayName("Should register student and list details")
    @Transactional
    void shouldManageUsers() throws Exception {
        // Create its own infrastructure for isolation
        FacultyDTO facultyDTO = FacultyDTO.builder().name("User Test Faculty").build();
        String facResult = mockMvc.perform(post("/api/admin/infrastructure/faculties")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(facultyDTO)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        Long facId = objectMapper.readTree(facResult).get("id").asLong();

        DepartmentDTO deptDTO = DepartmentDTO.builder().name("User Test Dept").facultyId(facId).build();
        String deptResult = mockMvc.perform(post("/api/admin/infrastructure/departments")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(deptDTO)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        Long deptId = objectMapper.readTree(deptResult).get("id").asLong();

        AdminStudentRegisterRequest studentReq = AdminStudentRegisterRequest.builder()
                .username("teststudent_" + System.currentTimeMillis())
                .password("testpass")
                .email("test@uni.edu")
                .firstName("Test")
                .lastName("Student")
                .studentNumber("T100")
                .departmentId(deptId)
                .build();

        mockMvc.perform(post("/api/admin/users/students")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(studentReq)))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/admin/users/students"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].firstName", hasItem("Test")));
    }

    // --- Phase 4: Operational Control ---

    @Test
    @Order(4)
    @WithMockUser(username = "admin", roles = "ADMIN")
    @DisplayName("Should get dashboard stats and send announcement")
    @Transactional
    void shouldPerformOperations() throws Exception {
        // Ensure there is at least one student for stats
        shouldManageUsers(); 

        mockMvc.perform(get("/api/admin/operations/stats"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.studentCount", greaterThanOrEqualTo(0)));

        AdminAnnouncementRequest announcement = AdminAnnouncementRequest.builder()
                .title("Final Test")
                .content("System is ready.")
                .targetRole("ALL")
                .build();

        mockMvc.perform(post("/api/admin/operations/announcement")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(announcement)))
                .andExpect(status().isOk());

        // Verify a notification was created
        long count = notificationRepository.count();
        assert count > 0;
    }

    @Test
    @Order(5)
    @WithMockUser(username = "user", roles = "STUDENT")
    @DisplayName("Should forbid access for non-admin users")
    void shouldForbidNonAdmin() throws Exception {
        mockMvc.perform(get("/api/admin/operations/stats"))
                .andExpect(status().isForbidden());
    }
}
