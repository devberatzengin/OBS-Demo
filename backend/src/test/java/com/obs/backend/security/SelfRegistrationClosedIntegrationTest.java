package com.obs.backend.security;

import com.obs.backend.repository.UserRepository;
import com.obs.backend.support.AbstractIntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * The public /api/auth/register endpoint took the role from the request, so anyone could
 * create an ADMIN account. Accounts are created by admins and staff only (decision K3).
 */
@Transactional
class SelfRegistrationClosedIntegrationTest extends AbstractIntegrationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private UserRepository userRepository;

    @Test
    void anonymousUsersCannotCreateAnAdminAccount() throws Exception {
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"intruder\",\"password\":\"password123\","
                                + "\"email\":\"in.truder@uni.edu.tr\",\"firstName\":\"In\",\"lastName\":\"Truder\","
                                + "\"role\":\"ADMIN\",\"number\":\"X1\"}"))
                .andExpect(status().isNotFound());

        assertThat(userRepository.existsByUsername("intruder")).isFalse();
    }
}
