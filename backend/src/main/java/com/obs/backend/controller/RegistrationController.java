package com.obs.backend.controller;

import com.obs.backend.dto.registration.RegistrationRequest;
import com.obs.backend.dto.student.CourseDTO;
import com.obs.backend.service.RegistrationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/student/registration")
@RequiredArgsConstructor
@PreAuthorize("hasRole('STUDENT')")
public class RegistrationController {

    private final RegistrationService registrationService;

    @GetMapping("/available-courses")
    public ResponseEntity<List<CourseDTO>> getAvailableCourses(Principal principal) {
        return ResponseEntity.ok(registrationService.getAvailableCourses(principal.getName()));
    }

    @PostMapping("/enroll")
    public ResponseEntity<String> enroll(@RequestBody RegistrationRequest request, Principal principal) {
        registrationService.enrollCourses(principal.getName(), request);
        return ResponseEntity.ok("Registration completed successfully!");
    }
}
