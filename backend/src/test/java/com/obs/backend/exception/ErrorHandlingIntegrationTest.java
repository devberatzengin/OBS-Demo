package com.obs.backend.exception;

import com.obs.backend.support.AbstractIntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Client mistakes used to fall through to the generic handler and come back as 500. */
class ErrorHandlingIntegrationTest extends AbstractIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void malformedJsonIsBadRequest() throws Exception {
        mockMvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON).content("{not json"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCode").value(ErrorCode.BAD_REQUEST.getCode()));
    }

    @Test
    @WithMockUser(roles = "ACADEMICIAN")
    void nonNumericIdIsBadRequest() throws Exception {
        mockMvc.perform(get("/api/academician/courses/abc/students"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.description").value("Invalid value for parameter 'courseId'."));
    }

    @Test
    @WithMockUser
    void unknownEndpointIsNotFound() throws Exception {
        mockMvc.perform(get("/api/does-not-exist"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.errorCode").value(ErrorCode.RESOURCE_NOT_FOUND.getCode()));
    }

    @Test
    @WithMockUser(roles = "STUDENT")
    void wrongHttpMethodIsMethodNotAllowed() throws Exception {
        mockMvc.perform(post("/api/student/dashboard"))
                .andExpect(status().isMethodNotAllowed());
    }
}
