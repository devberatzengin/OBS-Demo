package com.obs.backend.security;

import com.obs.backend.model.Administrative;
import com.obs.backend.model.Student;
import com.obs.backend.model.enums.Role;
import com.obs.backend.support.AbstractIntegrationTest;
import com.obs.backend.support.AuthHelper;
import com.obs.backend.support.TestDataFactory;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.RequestPostProcessor;
import org.springframework.transaction.annotation.Transactional;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Plan 1.4: a deactivated account loses access immediately, even with an unexpired token. */
@Transactional
class DeactivatedAccountAccessIntegrationTest extends AbstractIntegrationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private TestDataFactory data;
    @Autowired private AuthHelper auth;

    private Administrative admin;
    private Student student;

    @BeforeEach
    void setUp() {
        admin = data.staff(Role.ADMIN);
        student = data.student(data.department(), null);
    }

    @Test
    void deactivatedUsersExistingTokenIsRejected() throws Exception {
        RequestPostProcessor studentToken = auth.as(student);
        mockMvc.perform(get("/api/todos").with(studentToken)).andExpect(status().isOk());

        mockMvc.perform(delete("/api/admin/users/" + student.getId()).with(auth.as(admin)))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/todos").with(studentToken))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void deactivatedUserCannotSignIn() throws Exception {
        mockMvc.perform(delete("/api/admin/users/" + student.getId()).with(auth.as(admin)))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"identifier\":\"" + student.getUsername() + "\",\"password\":\"" + TestDataFactory.PASSWORD + "\"}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void requestsWithoutTokenGet401() throws Exception {
        mockMvc.perform(get("/api/todos"))
                .andExpect(status().isUnauthorized());
    }
}
