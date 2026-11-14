package com.obs.backend.integrity;

import com.obs.backend.model.*;
import com.obs.backend.model.enums.Role;
import com.obs.backend.support.AbstractIntegrationTest;
import com.obs.backend.support.AuthHelper;
import com.obs.backend.support.TestDataFactory;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.hamcrest.Matchers.notNullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Plan 3.4: invalid bodies get 400 with one message per field; authorization still comes first. */
@Transactional
class RequestValidationIntegrationTest extends AbstractIntegrationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private TestDataFactory data;
    @Autowired private AuthHelper auth;

    private Department department;
    private Academician instructor;
    private Course course;
    private Administrative admin;

    @BeforeEach
    void setUp() {
        department = data.department();
        instructor = data.academician(department);
        course = data.course(department, instructor);
        admin = data.staff(Role.ADMIN);
        data.activeSemester();
    }

    @Test
    void anInvalidExamListsEveryField() throws Exception {
        mockMvc.perform(post("/api/academician/courses/" + course.getId() + "/exams").with(auth.as(instructor))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"ratio\":150}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCode").value("OBS-001"))
                .andExpect(jsonPath("$.fieldErrors.examType").value(notNullValue()))
                .andExpect(jsonPath("$.fieldErrors.examDate").value(notNullValue()))
                .andExpect(jsonPath("$.fieldErrors.ratio").value(notNullValue()))
                .andExpect(jsonPath("$.fieldErrors.classroomId").value(notNullValue()));
    }

    @Test
    void nestedGradeEntriesAreValidated() throws Exception {
        mockMvc.perform(post("/api/academician/exams/1/grades").with(auth.as(instructor))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"grades\":[{\"studentId\":1,\"score\":120}]}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors['grades[0].score']").value(notNullValue()));
    }

    @Test
    void anInvalidAccountListsEmailAndPassword() throws Exception {
        mockMvc.perform(post("/api/admin/users/students").with(auth.as(admin))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"newstudent\",\"password\":\"short\",\"email\":\"not-an-email\","
                                + "\"firstName\":\"New\",\"lastName\":\"Student\",\"studentNumber\":\"N1\","
                                + "\"departmentId\":" + department.getId() + "}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.email").value(notNullValue()))
                .andExpect(jsonPath("$.fieldErrors.password").value(notNullValue()));
    }

    @Test
    void aNewAccountNeedsAPassword() throws Exception {
        mockMvc.perform(post("/api/admin/users/students").with(auth.as(admin))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"nopassword\",\"email\":\"nopassword@uni.edu\","
                                + "\"firstName\":\"New\",\"lastName\":\"Student\",\"studentNumber\":\"N2\","
                                + "\"departmentId\":" + department.getId() + "}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCode").value("OBS-001"));
    }

    @Test
    void aTakenUsernameIsAConflict() throws Exception {
        Student existing = data.student(department, instructor);

        mockMvc.perform(post("/api/admin/users/students").with(auth.as(admin))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"" + existing.getUsername() + "\",\"password\":\"password123\","
                                + "\"email\":\"someone.else@uni.edu\",\"firstName\":\"New\",\"lastName\":\"Student\","
                                + "\"studentNumber\":\"N3\",\"departmentId\":" + department.getId() + "}"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.errorCode").value("OBS-006"));
    }

    @Test
    void aCallerWithoutTheRoleGets403EvenWithAnInvalidBody() throws Exception {
        Student student = data.student(department, instructor);
        Administrative staff = data.staff(Role.ADMINISTRATIVE);

        mockMvc.perform(post("/api/academician/courses/" + course.getId() + "/exams").with(auth.as(student))
                        .contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isForbidden());
        mockMvc.perform(post("/api/admin/users/administrative").with(auth.as(staff))
                        .contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isForbidden());
    }
}
