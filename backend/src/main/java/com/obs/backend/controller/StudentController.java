package com.obs.backend.controller;

import com.obs.backend.dto.student.*;
import com.obs.backend.service.AttendanceService;
import com.obs.backend.service.MessagingService;
import com.obs.backend.service.RegistrationService;
import com.obs.backend.service.StudentService;
import com.obs.backend.service.TodoService;
import com.obs.backend.service.TranscriptService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/student")
@RequiredArgsConstructor
@PreAuthorize("hasRole('STUDENT')")
public class StudentController {

    private final StudentService studentService;
    private final TranscriptService transcriptService;
    private final AttendanceService attendanceService;
    private final TodoService todoService;
    private final MessagingService messagingService;
    private final RegistrationService registrationService;

    @GetMapping("/dashboard")
    public ResponseEntity<StudentDashboardDTO> getDashboard(Principal principal) {
        return ResponseEntity.ok(studentService.getDashboardData(principal.getName()));
    }

    @GetMapping("/profile")
    public ResponseEntity<StudentProfileDTO> getProfile(Principal principal) {
        return ResponseEntity.ok(studentService.getProfileData(principal.getName()));
    }

    @PutMapping("/profile")
    public ResponseEntity<Void> updateProfile(Principal principal, @RequestBody com.obs.backend.dto.user.UpdateProfileRequest request) {
        studentService.updateProfile(principal.getName(), request);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/available-courses")
    public ResponseEntity<List<CourseDTO>> getAvailableCourses(Principal principal) {
        return ResponseEntity.ok(registrationService.getAvailableCourses(principal.getName()));
    }

    @PostMapping("/register-course/{courseId}")
    public ResponseEntity<Void> registerCourse(@PathVariable Long courseId, Principal principal) {
        registrationService.registerCourse(principal.getName(), courseId);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/exam-calendar")
    public ResponseEntity<List<ExamDTO>> getExamCalendar(Principal principal) {
        return ResponseEntity.ok(studentService.getExamCalendar(principal.getName()));
    }

    @GetMapping("/weekly-schedule")
    public ResponseEntity<List<ScheduleDTO>> getWeeklySchedule(Principal principal) {
        return ResponseEntity.ok(studentService.getWeeklySchedule(principal.getName()));
    }

    @GetMapping("/transcript")
    public ResponseEntity<TranscriptDTO> getTranscript(Principal principal) {
        return ResponseEntity.ok(transcriptService.getTranscript(principal.getName()));
    }

    @GetMapping("/attendance")
    public ResponseEntity<List<AttendanceDTO>> getAttendance(Principal principal) {
        return ResponseEntity.ok(attendanceService.getAttendanceReport(principal.getName()));
    }

    @PostMapping("/simulate-gpa")
    public ResponseEntity<Double> simulateGpa(@RequestBody SimulationRequest request, Principal principal) {
        return ResponseEntity.ok(transcriptService.simulateGpa(principal.getName(), request));
    }
}
