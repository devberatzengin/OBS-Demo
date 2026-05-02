package com.obs.backend.service;

import com.obs.backend.dto.academician.*;
import com.obs.backend.dto.user.UpdateProfileRequest;
import com.obs.backend.model.Exam;
import java.util.List;

public interface AcademicianService {
    AcademicianProfileDTO getProfile();

    void updateProfile(String username, com.obs.backend.dto.user.UpdateProfileRequest request);

    List<AcademicianCourseDTO> getMyCourses();

    List<AcademicianStudentDTO> getCourseStudents(Long courseId);

    List<AcademicianStudentDTO> getMyAdvisees();

    // Phase 1.5 - Enhanced Features
    void updateCourseSyllabus(Long courseId, CourseSyllabusRequest request);

    List<AcademicianScheduleDTO> getMySchedule();

    List<AdviseePerformanceDTO> getAdviseePerformance();

    // Phase 2
    void createExam(Long courseId, ExamRequest request);

    void updateExam(Long examId, ExamRequest request);

    void deleteExam(Long examId);

    List<AcademicianExamDTO> getCourseExams(Long courseId);

    List<GradeEntryRequest.StudentGradeDTO> getExamGrades(Long examId);

    void enterGrades(Long examId, GradeEntryRequest request);

    void recordAttendance(Long courseId, AttendanceEntryRequest request);

    List<AttendanceEntryRequest.StudentAttendanceDTO> getTodayAttendance(Long courseId);

    void openCourse(Long courseId, CourseOpenRequest request);

    void sendMessageToAdvisee(Long studentId, AdviseeMessageRequest request);

    // Phase 3 - Advanced Portal
    List<com.obs.backend.dto.academician.PendingEnrollmentDTO> getPendingAdviseeEnrollments();

    void approveEnrollment(Long enrollmentId);

    void rejectEnrollment(Long enrollmentId);

    void postAnnouncement(Long courseId, AnnouncementRequest request);

    List<com.obs.backend.model.Announcement> getCourseAnnouncements(Long courseId);

    void setOfficeHours(List<OfficeHourRequest> requests);

    List<com.obs.backend.model.OfficeHour> getMyOfficeHours();

    CourseAnalyticsResponse getCourseAnalytics(Long courseId);

    List<com.obs.backend.dto.academician.AcademicianScheduleDTO> getCourseSchedule(Long courseId);

    java.util.Map<String, List<com.obs.backend.dto.academician.AcademicianStudentDTO>> getAllStudentsGroupedByCourse();

    // Phase 4 - Final Frontier
    String exportCourseGrades(Long courseId);

    String exportAdviseeList();
}
