package com.obs.backend.security.ratelimit;

import com.obs.backend.exception.ErrorCode;
import com.obs.backend.support.AbstractIntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.RequestPostProcessor;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Plan 1.6. Uses its own client IP so the shared limiter does not affect other tests. */
class LoginRateLimitIntegrationTest extends AbstractIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    private static RequestPostProcessor fromIp(String ip) {
        return request -> {
            request.setRemoteAddr(ip);
            return request;
        };
    }

    @Test
    void sixthFailedLoginWithinAMinuteGets429() throws Exception {
        String body = "{\"identifier\":\"ratelimit-probe\",\"password\":\"wrong-password\"}";

        for (int i = 0; i < 5; i++) {
            mockMvc.perform(post("/api/auth/login").with(fromIp("10.66.0.1"))
                            .contentType(MediaType.APPLICATION_JSON).content(body))
                    .andExpect(status().isUnauthorized());
        }

        mockMvc.perform(post("/api/auth/login").with(fromIp("10.66.0.1"))
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isTooManyRequests())
                .andExpect(header().exists(HttpHeaders.RETRY_AFTER))
                .andExpect(jsonPath("$.errorCode").value(ErrorCode.TOO_MANY_REQUESTS.getCode()));
    }
}
