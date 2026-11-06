package com.obs.backend.security.jwt;

import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class JwtUtilsTest {

    private JwtUtils withSecret(String secret) {
        JwtUtils utils = new JwtUtils();
        ReflectionTestUtils.setField(utils, "jwtSecret", secret);
        return utils;
    }

    @Test
    void refusesToStartWithoutSecret() {
        assertThatThrownBy(() -> withSecret(null).validateSecret())
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("OBS_JWT_SECRET");
    }

    @Test
    void refusesSecretShorterThan32Bytes() {
        assertThatThrownBy(() -> withSecret("x".repeat(31)).validateSecret())
                .isInstanceOf(IllegalStateException.class);
    }

    @Test
    void acceptsSecretOf32Bytes() {
        assertThatCode(() -> withSecret("x".repeat(32)).validateSecret()).doesNotThrowAnyException();
    }
}
