package com.obs.backend.admin;

import com.obs.backend.model.*;
import com.obs.backend.model.enums.Role;
import com.obs.backend.repository.NotificationRepository;
import com.obs.backend.repository.StudentRepository;
import com.obs.backend.service.LoggingService;
import com.obs.backend.support.AbstractIntegrationTest;
import com.obs.backend.support.AuthHelper;
import com.obs.backend.support.TestDataFactory;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Plan 4.2: admin lists come one page at a time, searched and filtered by the database. */
@Transactional
class AdminListPagingIntegrationTest extends AbstractIntegrationTest {

    private static final int STUDENTS = 30;

    @Autowired private MockMvc mockMvc;
    @Autowired private TestDataFactory data;
    @Autowired private AuthHelper auth;
    @Autowired private StudentRepository studentRepository;
    @Autowired private NotificationRepository notificationRepository;
    @Autowired private LoggingService loggingService;

    private Department department;
    private Academician advisor;
    private Administrative admin;
    private final List<Student> students = new ArrayList<>();

    @BeforeEach
    void setUp() {
        department = data.department();
        advisor = data.academician(department);
        admin = data.staff(Role.ADMIN);
        for (int i = 0; i < STUDENTS; i++) {
            students.add(data.student(department, advisor));
        }
    }

    @Test
    void studentsComeInPages() throws Exception {
        String dept = String.valueOf(department.getId());

        mockMvc.perform(get("/api/admin/users/students").param("departmentId", dept).with(auth.as(admin)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(25)))
                .andExpect(jsonPath("$.page").value(0))
                .andExpect(jsonPath("$.totalElements").value(STUDENTS))
                .andExpect(jsonPath("$.totalPages").value(2));

        mockMvc.perform(get("/api/admin/users/students").param("departmentId", dept).param("page", "1").with(auth.as(admin)))
                .andExpect(jsonPath("$.content", hasSize(STUDENTS - 25)));
    }

    @Test
    void theSearchRunsInTheDatabase() throws Exception {
        Student target = students.get(7);
        target.setFirstName("Zeynep");
        target.setLastName("Kaya");
        studentRepository.save(target);

        // Full name, any case
        mockMvc.perform(get("/api/admin/users/students").param("q", "zeynep KAYA").with(auth.as(admin)))
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.content[0].id").value(target.getId()));
        // Number
        mockMvc.perform(get("/api/admin/users/students").param("q", target.getStudentNumber()).with(auth.as(admin)))
                .andExpect(jsonPath("$.content[*].id", hasItem(target.getId().intValue())));
        // LIKE wildcards in the term are taken literally
        mockMvc.perform(get("/api/admin/users/students").param("q", "%").param("departmentId",
                        String.valueOf(department.getId())).with(auth.as(admin)))
                .andExpect(jsonPath("$.totalElements").value(0));
    }

    @Test
    void anotherDepartmentFiltersEverythingOut() throws Exception {
        Department other = data.department();

        mockMvc.perform(get("/api/admin/users/students").param("departmentId", String.valueOf(other.getId())).with(auth.as(admin)))
                .andExpect(jsonPath("$.totalElements").value(0));
    }

    @Test
    void theSizeIsCapped() throws Exception {
        mockMvc.perform(get("/api/admin/users/students").param("size", "5000").with(auth.as(admin)))
                .andExpect(jsonPath("$.size").value(100));
    }

    @Test
    void departmentsCarryTheirCounts() throws Exception {
        data.course(department, advisor);
        data.course(department, advisor);

        mockMvc.perform(get("/api/admin/infrastructure/departments").with(auth.as(admin)))
                .andExpect(jsonPath("$[?(@.id == " + department.getId() + ")].studentCount").value(STUDENTS))
                .andExpect(jsonPath("$[?(@.id == " + department.getId() + ")].courseCount").value(2));
    }

    @Test
    void coursesComeInPagesAndTheStatsCountUnassignedOnes() throws Exception {
        Course assigned = data.course(department, advisor);
        data.course(department, null);

        mockMvc.perform(get("/api/admin/academics/courses").param("departmentId", String.valueOf(department.getId()))
                        .param("q", assigned.getCode()).with(auth.as(admin)))
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.content[0].instructorId").value(advisor.getId()));
        mockMvc.perform(get("/api/admin/operations/stats").with(auth.as(admin)))
                .andExpect(jsonPath("$.unassignedCourseCount").value(org.hamcrest.Matchers.greaterThanOrEqualTo(1)));
    }

    @Test
    void thePickersGetEveryAcademician() throws Exception {
        mockMvc.perform(get("/api/admin/users/academicians/options").with(auth.as(admin)))
                .andExpect(jsonPath("$[*].id", hasItem(advisor.getId().intValue())));
    }

    @Test
    void theAuditLogIsPaged() throws Exception {
        for (int i = 0; i < 12; i++) {
            loggingService.log("TEST_ACTION", "entry " + i, "tester", "Test", String.valueOf(i));
        }

        mockMvc.perform(get("/api/admin/operations/logs").with(auth.as(admin)))
                .andExpect(jsonPath("$.content", hasSize(10)))
                .andExpect(jsonPath("$.totalElements").value(org.hamcrest.Matchers.greaterThanOrEqualTo(12)));
    }

    @Test
    void anAnnouncementReachesEveryActiveStudentInOneStatement() throws Exception {
        long before = notificationRepository.count();
        long activeStudents = studentRepository.findAll().stream().filter(User::isActive).count();

        mockMvc.perform(post("/api/admin/operations/announcement").with(auth.as(admin))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"Exam week\",\"content\":\"Good luck\",\"targetRole\":\"STUDENT\"}"))
                .andExpect(status().isOk());

        assertThat(notificationRepository.count() - before).isEqualTo(activeStudents);
    }

    @Test
    void anUnknownTargetRoleIsRejected() throws Exception {
        mockMvc.perform(post("/api/admin/operations/announcement").with(auth.as(admin))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"x\",\"content\":\"y\",\"targetRole\":\"ROBOTS\"}"))
                .andExpect(status().isBadRequest());
    }
}
