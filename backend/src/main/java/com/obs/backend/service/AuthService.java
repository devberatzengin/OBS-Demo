package com.obs.backend.service;

import com.obs.backend.dto.auth.JwtResponse;
import com.obs.backend.dto.auth.LoginRequest;

public interface AuthService {
    JwtResponse login(LoginRequest loginRequest);
}
