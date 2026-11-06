package com.obs.backend.security;

import com.obs.backend.support.AbstractIntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class SecurityConfigIntegrationTest extends AbstractIntegrationTest {

    private static final String FRONTEND = "http://localhost:5173";

    @Autowired
    private MockMvc mockMvc;

    @Test
    void corsPreflightAllowsConfiguredFrontendOrigin() throws Exception {
        mockMvc.perform(options("/api/auth/login")
                        .header(HttpHeaders.ORIGIN, FRONTEND)
                        .header(HttpHeaders.ACCESS_CONTROL_REQUEST_METHOD, "POST"))
                .andExpect(status().isOk())
                .andExpect(header().string(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN, FRONTEND));
    }

    @Test
    void corsPreflightRejectsUnknownOriginOnAuthEndpoints() throws Exception {
        // AuthController used @CrossOrigin("*"), which overrode the global CORS policy
        mockMvc.perform(options("/api/auth/login")
                        .header(HttpHeaders.ORIGIN, "https://evil.example")
                        .header(HttpHeaders.ACCESS_CONTROL_REQUEST_METHOD, "POST"))
                .andExpect(status().isForbidden());
    }

    @Test
    void corsPreflightRejectsUnknownOriginOnMessaging() throws Exception {
        mockMvc.perform(options("/api/messaging/contacts")
                        .header(HttpHeaders.ORIGIN, "https://evil.example")
                        .header(HttpHeaders.ACCESS_CONTROL_REQUEST_METHOD, "GET"))
                .andExpect(status().isForbidden());
    }

    @Test
    void h2ConsoleIsNotPublic() throws Exception {
        mockMvc.perform(get("/h2-console/"))
                .andExpect(status().isForbidden());
    }

    @Test
    void responsesForbidFraming() throws Exception {
        mockMvc.perform(get("/api/student/dashboard"))
                .andExpect(header().string("X-Frame-Options", "DENY"));
    }
}
