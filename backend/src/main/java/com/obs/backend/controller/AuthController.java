package com.obs.backend.controller;

import com.obs.backend.dto.auth.JwtResponse;
import com.obs.backend.dto.auth.LoginRequest;
import com.obs.backend.dto.auth.RegisterRequest;
import com.obs.backend.security.ratelimit.LoginAttemptLimiter;
import com.obs.backend.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final LoginAttemptLimiter loginAttemptLimiter;

    @PostMapping("/login")
    public ResponseEntity<JwtResponse> authenticateUser(@Valid @RequestBody LoginRequest loginRequest,
                                                        HttpServletRequest request) {
        // getRemoteAddr, not X-Forwarded-For: a client could spoof that header to dodge the limit
        loginAttemptLimiter.check(request.getRemoteAddr(), loginRequest.getIdentifier());
        JwtResponse response = authService.login(loginRequest);
        loginAttemptLimiter.onSuccess(loginRequest.getIdentifier());
        return ResponseEntity.ok(response);
    }

/* 
    @PostMapping("/register")
    public ResponseEntity<String> registerUser(@Valid @RequestBody RegisterRequest registerRequest) {
        authService.register(registerRequest);
        return ResponseEntity.ok("User registered successfully!");
    }
*/
}
