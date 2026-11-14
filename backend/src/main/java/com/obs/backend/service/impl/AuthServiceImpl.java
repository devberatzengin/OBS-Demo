package com.obs.backend.service.impl;

import com.obs.backend.dto.auth.JwtResponse;
import com.obs.backend.dto.auth.LoginRequest;
import com.obs.backend.exception.ErrorCode;
import com.obs.backend.exception.ObsException;
import com.obs.backend.repository.UserRepository;
import com.obs.backend.security.jwt.JwtUtils;
import com.obs.backend.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final JwtUtils jwtUtils;

    @Override
    public JwtResponse login(LoginRequest loginRequest) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(loginRequest.getIdentifier(), loginRequest.getPassword()));

            SecurityContextHolder.getContext().setAuthentication(authentication);
            String jwt = jwtUtils.generateJwtToken(authentication);

            UserDetails userDetails = (UserDetails) authentication.getPrincipal();
            String role = userDetails.getAuthorities().stream()
                    .findFirst()
                    .map(r -> r.getAuthority().replace("ROLE_", ""))
                    .orElseThrow(() -> new ObsException(ErrorCode.AUTHENTICATION_FAILED, "User has no roles"));

            com.obs.backend.model.User user = userRepository.findByUsername(userDetails.getUsername())
                    .orElseThrow(() -> new ObsException(ErrorCode.RESOURCE_NOT_FOUND, "User not found"));

            return JwtResponse.builder()
                    .token(jwt)
                    .username(userDetails.getUsername())
                    .role(role)
                    .id(user.getId())
                    .firstName(user.getFirstName())
                    .lastName(user.getLastName())
                    .build();
        } catch (Exception e) {
            throw new ObsException(ErrorCode.AUTHENTICATION_FAILED, "Invalid username or password");
        }
    }
}
