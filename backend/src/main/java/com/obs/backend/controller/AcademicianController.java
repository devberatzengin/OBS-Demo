package com.obs.backend.controller;

import com.obs.backend.dto.academician.*;
import com.obs.backend.model.Exam;
import com.obs.backend.service.AcademicianService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/academician")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ACADEMICIAN')")
public class AcademicianController {

    private final AcademicianService academicianService;

    @GetMapping("/profile")
    public ResponseEntity<AcademicianProfileDTO> getProfile(java.security.Principal principal) {
        return ResponseEntity.ok(academicianService.getProfile());
    }

    @PutMapping("/profile")
    public ResponseEntity<Void> updateProfile(java.security.Principal principal, @RequestBody com.obs.backend.dto.user.UpdateProfileRequest request) {
        academicianService.updateProfile(principal.getName(), request);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/courses")
    public ResponseEntity<List<AcademicianCourseDTO>> getMyCourses() {
        return ResponseEntity.ok(academicianService.getMyCourses());
    }

    @GetMapping("/courses/{courseId}/students")
    public ResponseEntity<List<AcademicianStudentDTO>> getCourseStudents(@PathVariable Long courseId) {
        return ResponseEntity.ok(academicianService.getCourseStudents(courseId));
    }

    @GetMapping("/advisees")
    public ResponseEntity<List<AcademicianStudentDTO>> getMyAdvisees() {
        return ResponseEntity.ok(academicianService.getMyAdvisees());
    }

    @PutMapping("/courses/{courseId}/syllabus")
    public ResponseEntity<Void> updateCourseSyllabus(@PathVariable Long courseId, @RequestBody CourseSyllabusRequest request) {
        academicianService.updateCourseSyllabus(courseId, request);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/schedule")
    public ResponseEntity<List<AcademicianScheduleDTO>> getMySchedule() {
        return ResponseEntity.ok(academicianService.getMySchedule());
    }

    @GetMapping("/advisees/performance")
    public ResponseEntity<List<AdviseePerformanceDTO>> getAdviseePerformance() {
        return ResponseEntity.ok(academicianService.getAdviseePerformance());
    }

    // Phase 2 Endpoints
    @PostMapping("/courses/{courseId}/exams")
    public ResponseEntity<Void> createExam(@PathVariable Long courseId, @RequestBody ExamRequest request) {
        academicianService.createExam(courseId, request);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/exams/{examId}")
    public ResponseEntity<Void> updateExam(@PathVariable Long examId, @RequestBody ExamRequest request) {
        academicianService.updateExam(examId, request);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/exams/{examId}")
    public ResponseEntity<Void> deleteExam(@PathVariable Long examId) {
        academicianService.deleteExam(examId);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/courses/{courseId}/exams")
    public ResponseEntity<List<com.obs.backend.dto.academician.AcademicianExamDTO>> getCourseExams(@PathVariable Long courseId) {
        return ResponseEntity.ok(academicianService.getCourseExams(courseId));
    }

    @GetMapping("/exams/{examId}/grades")
    public ResponseEntity<List<GradeEntryRequest.StudentGradeDTO>> getExamGrades(@PathVariable Long examId) {
        return ResponseEntity.ok(academicianService.getExamGrades(examId));
    }

    @PostMapping("/exams/{examId}/grades")
    public ResponseEntity<Void> enterGrades(@PathVariable Long examId, @RequestBody GradeEntryRequest request) {
        academicianService.enterGrades(examId, request);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/courses/{courseId}/attendance")
    public ResponseEntity<Void> recordAttendance(@PathVariable Long courseId, @RequestBody AttendanceEntryRequest request) {
        academicianService.recordAttendance(courseId, request);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/courses/{courseId}/attendance/today")
    public ResponseEntity<List<AttendanceEntryRequest.StudentAttendanceDTO>> getTodayAttendance(@PathVariable Long courseId) {
        return ResponseEntity.ok(academicianService.getTodayAttendance(courseId));
    }

    @PutMapping("/courses/{courseId}/open")
    public ResponseEntity<Void> openCourse(@PathVariable Long courseId, @RequestBody CourseOpenRequest request) {
        academicianService.openCourse(courseId, request);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/advisees/{studentId}/message")
    public ResponseEntity<Void> sendMessageToAdvisee(@PathVariable Long studentId, @RequestBody AdviseeMessageRequest request) {
        academicianService.sendMessageToAdvisee(studentId, request);
        return ResponseEntity.ok().build();
    }

    // Phase 3 Endpoints
    @GetMapping("/advisees/enrollments/pending")
    public ResponseEntity<List<com.obs.backend.dto.academician.PendingEnrollmentDTO>> getPendingAdviseeEnrollments() {
        return ResponseEntity.ok(academicianService.getPendingAdviseeEnrollments());
    }

    @PutMapping("/enrollments/{enrollmentId}/approve")
    public ResponseEntity<Void> approveEnrollment(@PathVariable Long enrollmentId) {
        academicianService.approveEnrollment(enrollmentId);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/enrollments/{enrollmentId}/reject")
    public ResponseEntity<Void> rejectEnrollment(@PathVariable Long enrollmentId) {
        academicianService.rejectEnrollment(enrollmentId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/courses/{courseId}/announcements")
    public ResponseEntity<Void> postAnnouncement(@PathVariable Long courseId, @RequestBody AnnouncementRequest request) {
        academicianService.postAnnouncement(courseId, request);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/courses/{courseId}/announcements")
    public ResponseEntity<List<com.obs.backend.model.Announcement>> getCourseAnnouncements(@PathVariable Long courseId) {
        return ResponseEntity.ok(academicianService.getCourseAnnouncements(courseId));
    }

    @PostMapping("/office-hours")
    public ResponseEntity<Void> setOfficeHours(@RequestBody List<OfficeHourRequest> requests) {
        academicianService.setOfficeHours(requests);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/office-hours")
    public ResponseEntity<List<com.obs.backend.model.OfficeHour>> getMyOfficeHours() {
        return ResponseEntity.ok(academicianService.getMyOfficeHours());
    }

    @GetMapping("/courses/{courseId}/analytics")
    public ResponseEntity<CourseAnalyticsResponse> getCourseAnalytics(@PathVariable Long courseId) {
        return ResponseEntity.ok(academicianService.getCourseAnalytics(courseId));
    }

    @GetMapping("/courses/{courseId}/schedule")
    public ResponseEntity<List<com.obs.backend.dto.academician.AcademicianScheduleDTO>> getCourseSchedule(@PathVariable Long courseId) {
        return ResponseEntity.ok(academicianService.getCourseSchedule(courseId));
    }

    @GetMapping("/all-students")
    public ResponseEntity<java.util.Map<String, List<com.obs.backend.dto.academician.AcademicianStudentDTO>>> getAllStudentsGroupedByCourse() {
        return ResponseEntity.ok(academicianService.getAllStudentsGroupedByCourse());
    }

    // Phase 4 Endpoints
    @GetMapping(value = "/courses/{courseId}/export-grades", produces = "text/csv")
    public ResponseEntity<String> exportCourseGrades(@PathVariable Long courseId) {
        return ResponseEntity.ok(academicianService.exportCourseGrades(courseId));
    }

    @GetMapping(value = "/advisees/export", produces = "text/csv")
    public ResponseEntity<String> exportAdviseeList() {
        return ResponseEntity.ok(academicianService.exportAdviseeList());
    }
}
