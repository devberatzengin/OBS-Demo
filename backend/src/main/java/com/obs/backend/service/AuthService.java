package com.obs.backend.service;

import com.obs.backend.dto.auth.JwtResponse;
import com.obs.backend.dto.auth.LoginRequest;
import com.obs.backend.dto.auth.RegisterRequest;

public interface AuthService {
    JwtResponse login(LoginRequest loginRequest);
    void register(RegisterRequest registerRequest);
}
