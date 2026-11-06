package com.obs.backend.support;

import com.obs.backend.model.User;
import com.obs.backend.security.jwt.JwtUtils;
import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.stereotype.Component;
import org.springframework.test.web.servlet.request.RequestPostProcessor;

/**
 * Signs requests with a real JWT for a saved user, so tests go through AuthTokenFilter
 * and the same role and ownership checks as the frontend:
 * {@code mockMvc.perform(get("/api/todos").with(auth.as(student)))}.
 */
@Component
public class AuthHelper {

    private final JwtUtils jwtUtils;
    private final UserDetailsService userDetailsService;

    public AuthHelper(JwtUtils jwtUtils, UserDetailsService userDetailsService) {
        this.jwtUtils = jwtUtils;
        this.userDetailsService = userDetailsService;
    }

    public RequestPostProcessor as(User user) {
        return as(user.getUsername());
    }

    public RequestPostProcessor as(String username) {
        UserDetails details = userDetailsService.loadUserByUsername(username);
        String token = jwtUtils.generateJwtToken(
                new UsernamePasswordAuthenticationToken(details, null, details.getAuthorities()));
        return request -> {
            request.addHeader(HttpHeaders.AUTHORIZATION, "Bearer " + token);
            return request;
        };
    }
}
