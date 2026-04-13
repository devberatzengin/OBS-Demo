package com.obs.backend.service.impl;

import com.obs.backend.dto.auth.JwtResponse;
import com.obs.backend.dto.auth.LoginRequest;
import com.obs.backend.dto.auth.RegisterRequest;
import com.obs.backend.exception.ErrorCode;
import com.obs.backend.exception.ObsException;
import com.obs.backend.model.Academician;
import com.obs.backend.model.Administrative;
import com.obs.backend.model.Student;
import com.obs.backend.repository.AcademicianRepository;
import com.obs.backend.repository.AdministrativeRepository;
import com.obs.backend.repository.StudentRepository;
import com.obs.backend.repository.UserRepository;
import com.obs.backend.security.jwt.JwtUtils;
import com.obs.backend.security.validation.EmailValidator;
import com.obs.backend.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final StudentRepository studentRepository;
    private final AcademicianRepository academicianRepository;
    private final AdministrativeRepository administrativeRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils;
    private final EmailValidator emailValidator;

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

    @Override
    @Transactional
    public void register(RegisterRequest registerRequest) {
        // 1. Validation
        if (userRepository.existsByUsername(registerRequest.getUsername())) {
            throw new ObsException(ErrorCode.ALREADY_EXISTS, "Username is already taken");
        }
        if (userRepository.existsByEmail(registerRequest.getEmail())) {
            throw new ObsException(ErrorCode.ALREADY_EXISTS, "Email is already in use");
        }

        emailValidator.validate(registerRequest.getEmail(), registerRequest.getRole());

        // 2. Encryption
        String encodedPassword = passwordEncoder.encode(registerRequest.getPassword());

        // 3. Role-Based Persistence (Joined Table Inheritance)
        switch (registerRequest.getRole()) {
            case STUDENT -> {
                @lombok.NonNull Student student = Student.builder()
                        .username(registerRequest.getUsername())
                        .password(encodedPassword)
                        .email(registerRequest.getEmail())
                        .firstName(registerRequest.getFirstName())
                        .lastName(registerRequest.getLastName())
                        .role(registerRequest.getRole())
                        .studentNumber(registerRequest.getNumber() != null ? registerRequest.getNumber() : registerRequest.getUsername())
                        .isActive(true)
                        .build();
                studentRepository.save(student);
            }
            case ACADEMICIAN -> {
                @lombok.NonNull Academician academician = Academician.builder()
                        .username(registerRequest.getUsername())
                        .password(encodedPassword)
                        .email(registerRequest.getEmail())
                        .firstName(registerRequest.getFirstName())
                        .lastName(registerRequest.getLastName())
                        .role(registerRequest.getRole())
                        .staffNumber(registerRequest.getNumber())
                        .isActive(true)
                        .build();
                academicianRepository.save(academician);
            }
            case ADMINISTRATIVE, ADMIN -> {
                @lombok.NonNull Administrative administrative = Administrative.builder()
                        .username(registerRequest.getUsername())
                        .password(encodedPassword)
                        .email(registerRequest.getEmail())
                        .firstName(registerRequest.getFirstName())
                        .lastName(registerRequest.getLastName())
                        .role(registerRequest.getRole())
                        .staffNumber(registerRequest.getNumber())
                        .isActive(true)
                        .build();
                administrativeRepository.save(administrative);
            }
            default -> throw new ObsException(ErrorCode.BAD_REQUEST, "Unsupported role");
        }
    }
}
