package com.obs.backend.service.impl;

import com.obs.backend.dto.student.CourseDTO;
import com.obs.backend.dto.student.ExamDTO;
import com.obs.backend.dto.student.NotificationDTO;
import com.obs.backend.dto.student.ScheduleDTO;
import com.obs.backend.dto.student.StudentDashboardDTO;
import com.obs.backend.dto.student.StudentProfileDTO;
import com.obs.backend.exception.ErrorCode;
import com.obs.backend.exception.ObsException;
import com.obs.backend.model.Enrollment;
import com.obs.backend.model.enums.EnrollmentStatus;
import com.obs.backend.model.Semester;
import com.obs.backend.model.Student;
import com.obs.backend.repository.*;
import com.obs.backend.service.StudentService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class StudentServiceImpl implements StudentService {

    private final StudentRepository studentRepository;
    private final SemesterRepository semesterRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final NotificationRepository notificationRepository;
    private final ExamRepository examRepository;
    private final ScheduleRepository scheduleRepository;

    @Override
    public StudentDashboardDTO getDashboardData(String username) {
        // 1. Get Student
        Student student = studentRepository.findByUsername(username)
                .orElseThrow(() -> new ObsException(ErrorCode.RESOURCE_NOT_FOUND, "Student not found with username: " + username));

        // 2. Get Active Semester
        Semester activeSemester = semesterRepository.findByIsActiveTrue()
                .orElseThrow(() -> new ObsException(ErrorCode.RESOURCE_NOT_FOUND, "Active semester not found"));

        @lombok.NonNull Long studentId = student.getId();

        // 3. Get Recent Notifications
        List<NotificationDTO> recentNotifications = notificationRepository.findByUserIdOrderByTimestampDesc(studentId)
                .stream()
                .limit(5)
                .map(n -> NotificationDTO.builder()
                        .title(n.getTitle())
                        .message(n.getMessage())
                        .timestamp(n.getTimestamp())
                        .isRead(n.isRead())
                        .build())
                .collect(Collectors.toList());

        // 4. Get Current Courses (Enrollments for active semester)

        List<Enrollment> currentEnrollments = enrollmentRepository.findByStudentIdAndSemesterIdAndStatus(student.getId(), activeSemester.getId(), EnrollmentStatus.APPROVED);

        return StudentDashboardDTO.builder()
                .fullName(student.getFirstName() + " " + student.getLastName())
                .studentNumber(student.getStudentNumber())
                .gpa(student.getGpa())
                .facultyName(student.getDepartment() != null ? student.getDepartment().getFaculty().getName() : "N/A")
                .departmentName(student.getDepartment() != null ? student.getDepartment().getName() : "N/A")
                .activeSemesterName(activeSemester.getName())
                .currentSemester(student.getCurrentSemester())
                .advisorName(student.getAdvisor() != null ? student.getAdvisor().getFirstName() + " " + student.getAdvisor().getLastName() : "N/A")
                .advisorId(student.getAdvisor() != null ? student.getAdvisor().getId() : null)
                .recentNotifications(recentNotifications)
                .currentCourses(currentEnrollments.stream()
                        .map(e -> CourseDTO.builder()
                                .code(e.getCourse().getCode())
                                .name(e.getCourse().getName())
                                .akts(e.getCourse().getAkts())
                                .grade(e.getGrade())
                                .build())
                        .collect(Collectors.toList()))
                .build();
    }

    @Override
    public StudentProfileDTO getProfileData(String username) {
        Student student = studentRepository.findByUsername(username)
                .orElseThrow(() -> new ObsException(ErrorCode.RESOURCE_NOT_FOUND, "Student not found"));

        return StudentProfileDTO.builder()
                .fullName(student.getFirstName() + " " + student.getLastName())
                .studentNumber(student.getStudentNumber())
                .email(student.getEmail())
                .phoneNumber(student.getPhoneNumber())
                .address(student.getAddress())
                .facultyName(student.getDepartment() != null ? student.getDepartment().getFaculty().getName() : "N/A")
                .departmentName(student.getDepartment() != null ? student.getDepartment().getName() : "N/A")
                .advisorName(student.getAdvisor() != null ? student.getAdvisor().getFirstName() + " " + student.getAdvisor().getLastName() : "N/A")
                .registrationDate(student.getRegistrationDate())
                .currentSemester(student.getCurrentSemester())
                .build();
    }

    @Override
    public void updateProfile(String username, com.obs.backend.dto.user.UpdateProfileRequest request) {
        Student student = studentRepository.findByUsername(username)
                .orElseThrow(() -> new ObsException(ErrorCode.RESOURCE_NOT_FOUND, "Student not found"));

        if (request.getEmail() != null) student.setEmail(request.getEmail());
        if (request.getPhoneNumber() != null) student.setPhoneNumber(request.getPhoneNumber());
        if (request.getAddress() != null) student.setAddress(request.getAddress());

        studentRepository.save(student);
    }

    @Override
    public List<ExamDTO> getExamCalendar(String username) {
        Student student = getStudent(username);
        Semester activeSemester = getActiveSemester();

        if (activeSemester == null) return Collections.emptyList();

        @lombok.NonNull List<Long> enrolledIds = getEnrolledCourseIds(student.getId(), activeSemester.getId());
        @lombok.NonNull Long semId = activeSemester.getId();

        return examRepository.findByCourseIdInAndSemesterId(enrolledIds, semId)
                .stream()
                .map(exam -> ExamDTO.builder()
                        .courseCode(exam.getCourse().getCode())
                        .courseName(exam.getCourse().getName())
                        .examType(exam.getExamType())
                        .examDate(exam.getExamDate())
                        .classroomCode(exam.getClassroom().getCode())
                        .ratio(exam.getRatio())
                        .status(calculateExamStatus(exam))
                        .build())
                .collect(Collectors.toList());
    }

    @Override
    public List<ScheduleDTO> getWeeklySchedule(String username) {
        Student student = getStudent(username);
        Semester activeSemester = getActiveSemester();

        if (activeSemester == null) return Collections.emptyList();

        @lombok.NonNull List<Long> enrolledIds = getEnrolledCourseIds(student.getId(), activeSemester.getId());

        return scheduleRepository.findByCourseIdIn(enrolledIds)
                .stream()
                .map(s -> ScheduleDTO.builder()
                        .dayOfWeek(s.getDayOfWeek())
                        .startTime(s.getStartTime())
                        .endTime(s.getEndTime())
                        .courseCode(s.getCourse().getCode())
                        .courseName(s.getCourse().getName())
                        .classroomCode(s.getClassroom().getCode())
                        .instructorName(s.getCourse().getInstructor() != null ? 
                                s.getCourse().getInstructor().getFirstName() + " " + s.getCourse().getInstructor().getLastName() : "TBA")
                        .build())
                .collect(Collectors.toList());
    }

    private Student getStudent(String username) {
        return studentRepository.findByUsername(username)
                .orElseThrow(() -> new ObsException(ErrorCode.RESOURCE_NOT_FOUND, "Student not found with username: " + username));
    }

    private Semester getActiveSemester() {
        return semesterRepository.findByIsActiveTrue().orElse(null);
    }

    private List<Long> getEnrolledCourseIds(Long studentId, Long semesterId) {
        return enrollmentRepository.findByStudentIdAndSemesterIdAndStatus(studentId, semesterId, EnrollmentStatus.APPROVED)
                .stream()
                .map(e -> e.getCourse().getId())
                .collect(Collectors.toList());
    }

    private String calculateExamStatus(com.obs.backend.model.Exam exam) {
        if (exam.getExamDate().isAfter(LocalDateTime.now())) {
            return "UPCOMING";
        }
        // Simplified: if it's in the past, we'd normally check enrollment for a grade
        // For now, if past, call it COMPLETED
        return "COMPLETED";
    }
}
