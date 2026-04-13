package com.obs.backend.service.impl;

import com.obs.backend.dto.academician.*;
import com.obs.backend.exception.ErrorCode;
import com.obs.backend.exception.ObsException;
import com.obs.backend.model.*;
import com.obs.backend.model.enums.EnrollmentStatus;
import com.obs.backend.repository.*;
import com.obs.backend.service.AcademicianService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.*;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class AcademicianServiceImpl implements AcademicianService {

    private final AcademicianRepository academicianRepository;
    private final CourseRepository courseRepository;
    private final StudentRepository studentRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final ScheduleRepository scheduleRepository;
    private final ExamRepository examRepository;
    private final GradeRepository gradeRepository;
    private final AttendanceRecordRepository attendanceRecordRepository;
    private final ClassroomRepository classroomRepository;
    private final SemesterRepository semesterRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final UserRepository userRepository;
    private final AnnouncementRepository announcementRepository;
    private final OfficeHourRepository officeHourRepository;
    private final NotificationRepository notificationRepository;

    @Override
    public AcademicianProfileDTO getProfile() {
        Academician academician = getCurrentAcademician();
        return AcademicianProfileDTO.builder()
                .id(academician.getId())
                .firstName(academician.getFirstName())
                .lastName(academician.getLastName())
                .fullName(academician.getFirstName() + " " + academician.getLastName())
                .email(academician.getEmail())
                .phoneNumber(academician.getPhoneNumber())
                .address(academician.getAddress())
                .departmentName(academician.getDepartment() != null ? academician.getDepartment().getName() : "N/A")
                .title(academician.getAcademicTitle())
                .office(academician.getOfficeNumber())
                .build();
    }

    @Override
    @Transactional
    public void updateProfile(String username, com.obs.backend.dto.user.UpdateProfileRequest request) {
        Academician academician = academicianRepository.findByUsername(username)
                .orElseThrow(() -> new ObsException(ErrorCode.RESOURCE_NOT_FOUND, "Academician not found"));

        if (request.getEmail() != null)
            academician.setEmail(request.getEmail());
        if (request.getPhoneNumber() != null)
            academician.setPhoneNumber(request.getPhoneNumber());
        if (request.getAddress() != null)
            academician.setAddress(request.getAddress());

        System.out.println("Updating profile for academician: " + username);
        System.out.println("Request data: email=" + request.getEmail() + ", phone=" + request.getPhoneNumber()
                + ", address=" + request.getAddress());

        Academician saved = academicianRepository.saveAndFlush(academician);
        System.out.println("Profile saved successfully for: " + saved.getUsername());
    }

    @Override
    public List<AcademicianCourseDTO> getMyCourses() {
        Academician currentHoca = getCurrentAcademician();
        return courseRepository.findByInstructorId(currentHoca.getId()).stream()
                .map(course -> AcademicianCourseDTO.builder()
                        .id(course.getId())
                        .code(course.getCode())
                        .name(course.getName())
                        .akts(course.getAkts())
                        .credits(course.getCredits())
                        .studentCount((int) enrollmentRepository.countByCourseId(course.getId()))
                        .build())
                .collect(Collectors.toList());
    }

    @Override
    public List<AcademicianStudentDTO> getCourseStudents(@lombok.NonNull Long courseId) {
        Academician currentHoca = getCurrentAcademician();

        // Security Check: Is this course assigned to this instructor?
        var course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ObsException(ErrorCode.RESOURCE_NOT_FOUND, "Course not found"));

        if (course.getInstructor() == null || !course.getInstructor().getId().equals(currentHoca.getId())) {
            throw new ObsException(ErrorCode.ACCESS_DENIED, "You are not the instructor of this course");
        }

        return enrollmentRepository.findByCourseIdAndStatus(courseId, EnrollmentStatus.APPROVED).stream()
                .map(enrollment -> {
                    var student = enrollment.getStudent();

                    // Calculate attendance rate
                    List<AttendanceRecord> records = attendanceRecordRepository.findByEnrollmentId(enrollment.getId());
                    double attendanceRate = 100.0;
                    if (!records.isEmpty()) {
                        long presentCount = records.stream().filter(AttendanceRecord::isPresent).count();
                        attendanceRate = (double) presentCount / records.size() * 100.0;
                    }

                    return AcademicianStudentDTO.builder()
                            .id(student.getId())
                            .studentNumber(student.getStudentNumber())
                            .firstName(student.getFirstName())
                            .lastName(student.getLastName())
                            .departmentName(student.getDepartment() != null ? student.getDepartment().getName() : "N/A")
                            .currentSemester(student.getCurrentSemester())
                            .gpa(student.getGpa())
                            .attendanceRate(attendanceRate)
                            .build();
                })
                .collect(Collectors.toList());
    }

    @Override
    public List<AcademicianStudentDTO> getMyAdvisees() {
        Academician currentHoca = getCurrentAcademician();
        return studentRepository.findByAdvisorId(currentHoca.getId()).stream()
                .map(student -> AcademicianStudentDTO.builder()
                        .id(student.getId())
                        .studentNumber(student.getStudentNumber())
                        .firstName(student.getFirstName())
                        .lastName(student.getLastName())
                        .departmentName(student.getDepartment() != null ? student.getDepartment().getName() : "N/A")
                        .currentSemester(student.getCurrentSemester())
                        .gpa(student.getGpa())
                        .build())
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void updateCourseSyllabus(@lombok.NonNull Long courseId,
            @lombok.NonNull com.obs.backend.dto.academician.CourseSyllabusRequest request) {
        Academician currentHoca = getCurrentAcademician();
        var course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ObsException(ErrorCode.RESOURCE_NOT_FOUND, "Course not found"));

        if (course.getInstructor() == null || !course.getInstructor().getId().equals(currentHoca.getId())) {
            throw new ObsException(ErrorCode.ACCESS_DENIED, "You are not the instructor of this course");
        }

        course.setDescription(request.getDescription());
        course.setSyllabus(request.getSyllabus());
        courseRepository.save(course);
    }

    @Override
    public List<com.obs.backend.dto.academician.AcademicianScheduleDTO> getMySchedule() {
        Academician currentHoca = getCurrentAcademician();
        return scheduleRepository.findByCourseInstructorId(currentHoca.getId()).stream()
                .map(schedule -> com.obs.backend.dto.academician.AcademicianScheduleDTO.builder()
                        .courseId(schedule.getCourse().getId())
                        .courseCode(schedule.getCourse().getCode())
                        .courseName(schedule.getCourse().getName())
                        .classroomName(schedule.getClassroom().getCode())
                        .dayOfWeek(schedule.getDayOfWeek())
                        .startTime(schedule.getStartTime())
                        .endTime(schedule.getEndTime())
                        .studentCount((int) enrollmentRepository.countByCourseId(schedule.getCourse().getId()))
                        .build())
                .collect(Collectors.toList());
    }

    @Override
    public List<com.obs.backend.dto.academician.AcademicianScheduleDTO> getCourseSchedule(Long courseId) {
        return scheduleRepository.findByCourseId(courseId).stream()
                .map(schedule -> com.obs.backend.dto.academician.AcademicianScheduleDTO.builder()
                        .courseId(schedule.getCourse().getId())
                        .courseCode(schedule.getCourse().getCode())
                        .courseName(schedule.getCourse().getName())
                        .classroomName(schedule.getClassroom().getCode())
                        .dayOfWeek(schedule.getDayOfWeek())
                        .startTime(schedule.getStartTime())
                        .endTime(schedule.getEndTime())
                        .studentCount((int) enrollmentRepository.countByCourseId(schedule.getCourse().getId()))
                        .build())
                .collect(Collectors.toList());
    }

    @Override
    public List<com.obs.backend.dto.academician.AdviseePerformanceDTO> getAdviseePerformance() {
        Academician currentHoca = getCurrentAcademician();
        return studentRepository.findByAdvisorId(currentHoca.getId()).stream()
                .map(student -> AdviseePerformanceDTO.builder()
                        .studentId(student.getId())
                        .studentNumber(student.getStudentNumber())
                        .firstName(student.getFirstName())
                        .lastName(student.getLastName())
                        .gpa(student.getGpa())
                        .isAtRisk(student.getGpa() < 2.0)
                        .departmentName(student.getDepartment().getName())
                        .currentSemester(student.getCurrentSemester())
                        .build())
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void createExam(@lombok.NonNull Long courseId, @lombok.NonNull ExamRequest request) {
        Academician currentHoca = getCurrentAcademician();
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ObsException(ErrorCode.RESOURCE_NOT_FOUND, "Course not found"));

        if (course.getInstructor() == null || !course.getInstructor().getId().equals(currentHoca.getId())) {
            throw new ObsException(ErrorCode.ACCESS_DENIED, "You are not the instructor of this course");
        }

        Semester activeSemester = semesterRepository.findByIsActiveTrue()
                .orElseThrow(() -> new ObsException(ErrorCode.INTERNAL_SERVER_ERROR, "Active semester not found"));

        Classroom classroom = classroomRepository.findById(request.getClassroomId())
                .orElseThrow(() -> new ObsException(ErrorCode.RESOURCE_NOT_FOUND, "Classroom not found"));

        Exam savedExam = Exam.builder()
                .examType(request.getExamType())
                .examDate(request.getExamDate())
                .ratio(request.getRatio())
                .course(course)
                .classroom(classroom)
                .semester(activeSemester)
                .build();
        examRepository.save(savedExam);
    }

    @Override
    @Transactional
    public void updateExam(@lombok.NonNull Long examId, @lombok.NonNull ExamRequest request) {
        Academician currentHoca = getCurrentAcademician();
        Exam exam = examRepository.findById(examId)
                .orElseThrow(() -> new ObsException(ErrorCode.RESOURCE_NOT_FOUND, "Exam not found"));

        if (exam.getCourse() == null || exam.getCourse().getInstructor() == null ||
                !exam.getCourse().getInstructor().getId().equals(currentHoca.getId())) {
            throw new ObsException(ErrorCode.ACCESS_DENIED, "You are not the instructor of this course");
        }

        Classroom classroom = classroomRepository.findById(request.getClassroomId())
                .orElseThrow(() -> new ObsException(ErrorCode.RESOURCE_NOT_FOUND, "Classroom not found"));

        exam.setExamType(request.getExamType());
        exam.setExamDate(request.getExamDate());
        exam.setRatio(request.getRatio());
        exam.setClassroom(classroom);

        examRepository.save(exam);
    }

    @Override
    @Transactional
    public void deleteExam(@lombok.NonNull Long examId) {
        Academician currentHoca = getCurrentAcademician();
        Exam exam = examRepository.findById(examId)
                .orElseThrow(() -> new ObsException(ErrorCode.RESOURCE_NOT_FOUND, "Exam not found"));

        if (exam.getCourse() == null || exam.getCourse().getInstructor() == null ||
                !exam.getCourse().getInstructor().getId().equals(currentHoca.getId())) {
            throw new ObsException(ErrorCode.ACCESS_DENIED, "You are not the instructor of this course");
        }

        examRepository.delete(exam);
    }

    @Override
    public List<com.obs.backend.dto.academician.AcademicianExamDTO> getCourseExams(@lombok.NonNull Long courseId) {
        Academician currentHoca = getCurrentAcademician();
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ObsException(ErrorCode.RESOURCE_NOT_FOUND, "Course not found"));

        if (course.getInstructor() == null || !course.getInstructor().getId().equals(currentHoca.getId())) {
            throw new ObsException(ErrorCode.ACCESS_DENIED, "You are not the instructor of this course");
        }

        return examRepository.findByCourseId(courseId).stream()
                .map(exam -> com.obs.backend.dto.academician.AcademicianExamDTO.builder()
                        .id(exam.getId())
                        .examType(exam.getExamType())
                        .examDate(exam.getExamDate())
                        .ratio(exam.getRatio())
                        .classroom(com.obs.backend.dto.academician.AcademicianExamDTO.ClassroomDTO.builder()
                                .id(exam.getClassroom().getId())
                                .code(exam.getClassroom().getCode())
                                .build())
                        .build())
                .collect(Collectors.toList());
    }

    @Override
    public List<GradeEntryRequest.StudentGradeDTO> getExamGrades(@lombok.NonNull Long examId) {
        Academician currentHoca = getCurrentAcademician();
        Exam exam = examRepository.findById(examId)
                .orElseThrow(() -> new ObsException(ErrorCode.RESOURCE_NOT_FOUND, "Exam not found"));

        if (exam.getCourse() == null || exam.getCourse().getInstructor() == null ||
                !exam.getCourse().getInstructor().getId().equals(currentHoca.getId())) {
            throw new ObsException(ErrorCode.ACCESS_DENIED, "You are not the instructor of this course");
        }

        return gradeRepository.findByExamId(examId).stream()
                .map(grade -> GradeEntryRequest.StudentGradeDTO.builder()
                        .studentId(grade.getEnrollment().getStudent().getId())
                        .score(grade.getScore())
                        .build())
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void enterGrades(@lombok.NonNull Long examId, @lombok.NonNull GradeEntryRequest request) {
        Academician currentHoca = getCurrentAcademician();
        Exam exam = examRepository.findById(examId)
                .orElseThrow(() -> new ObsException(ErrorCode.RESOURCE_NOT_FOUND, "Exam not found"));

        if (exam.getCourse() == null || exam.getCourse().getInstructor() == null ||
                !exam.getCourse().getInstructor().getId().equals(currentHoca.getId())) {
            throw new ObsException(ErrorCode.ACCESS_DENIED, "You are not the instructor of this course");
        }

        for (GradeEntryRequest.StudentGradeDTO gradeDto : request.getGrades()) {
            Enrollment enrollment = enrollmentRepository
                    .findByCourseIdAndStudentId(exam.getCourse().getId(), gradeDto.getStudentId())
                    .orElseThrow(() -> new ObsException(ErrorCode.RESOURCE_NOT_FOUND,
                            "Enrollment not found for student " + gradeDto.getStudentId()));

            if (enrollment.getStatus() != EnrollmentStatus.APPROVED) {
                throw new ObsException(ErrorCode.VALIDATION_ERROR,
                        "Cannot enter grade for non-approved enrollment of student " + gradeDto.getStudentId());
            }

            // Find existing grade or create new
            Grade grade = gradeRepository.findByEnrollmentId(enrollment.getId()).stream()
                    .filter(g -> g.getExam().getId().equals(examId))
                    .findFirst()
                    .orElse(Grade.builder().enrollment(enrollment).exam(exam).build());

            grade.setScore(gradeDto.getScore());
            gradeRepository.save(grade);

            // Real-time calculation
            updateEnrollmentScore(enrollment);

            // Notify student
            notificationRepository.save(Notification.builder()
                    .user(enrollment.getStudent())
                    .title("[" + exam.getCourse().getCode() + "] Grade Updated")
                    .message(exam.getExamType() + " grade has been updated to: " + gradeDto.getScore())
                    .build());
        }
    }

    private void updateEnrollmentScore(Enrollment enrollment) {
        List<Grade> studentGrades = gradeRepository.findByEnrollmentId(enrollment.getId());
        double totalScore = 0.0;
        for (Grade g : studentGrades) {
            totalScore += (g.getScore() * g.getExam().getRatio() / 100.0);
        }
        enrollment.setScore(totalScore);

        // Simple Grade translation logic (can be moved to a strategy later)
        if (totalScore >= 90)
            enrollment.setGrade("AA");
        else if (totalScore >= 85)
            enrollment.setGrade("BA");
        else if (totalScore >= 80)
            enrollment.setGrade("BB");
        else if (totalScore >= 75)
            enrollment.setGrade("CB");
        else if (totalScore >= 70)
            enrollment.setGrade("CC");
        else if (totalScore >= 65)
            enrollment.setGrade("DC");
        else if (totalScore >= 60)
            enrollment.setGrade("DD");
        else if (totalScore >= 50)
            enrollment.setGrade("FD");
        else
            enrollment.setGrade("FF");

        enrollmentRepository.save(enrollment);
    }

    @Override
    @Transactional
    public void recordAttendance(@lombok.NonNull Long courseId, @lombok.NonNull AttendanceEntryRequest request) {
        Academician currentHoca = getCurrentAcademician();
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ObsException(ErrorCode.RESOURCE_NOT_FOUND, "Course not found"));

        if (course.getInstructor() == null || !course.getInstructor().getId().equals(currentHoca.getId())) {
            throw new ObsException(ErrorCode.ACCESS_DENIED, "You are not the instructor of this course");
        }

        // --- TIME RESTRICTION LOGIC ---
        LocalDate attendanceDate = request.getAttendanceDate();
        LocalDateTime now = LocalDateTime.now();

        if (!attendanceDate.equals(now.toLocalDate())) {
            throw new ObsException(ErrorCode.VALIDATION_ERROR, "Attendance can only be recorded for the current day.");
        }

        DayOfWeek currentDay = now.getDayOfWeek();
        LocalTime currentTime = now.toLocalTime();

        List<Schedule> schedules = scheduleRepository.findByCourseId(courseId);
        boolean isWithinWindow = false;

        for (Schedule s : schedules) {
            if (s.getDayOfWeek() == currentDay) {
                LocalTime startTime = s.getStartTime();
                LocalTime allowedEndTime = s.getEndTime().plusHours(2);

                if (!currentTime.isBefore(startTime) && !currentTime.isAfter(allowedEndTime)) {
                    isWithinWindow = true;
                    break;
                }
            }
        }

        if (!isWithinWindow) {
            throw new ObsException(ErrorCode.VALIDATION_ERROR,
                    "Attendance can only be recorded during class hours or within 2 hours after the class ends.");
        }
        // ------------------------------

        for (AttendanceEntryRequest.StudentAttendanceDTO attendanceDto : request.getAttendance()) {
            Enrollment enrollment = enrollmentRepository
                    .findByCourseIdAndStudentId(courseId, attendanceDto.getStudentId())
                    .orElseThrow(() -> new ObsException(ErrorCode.RESOURCE_NOT_FOUND,
                            "Enrollment not found for student " + attendanceDto.getStudentId()));

            if (enrollment.getStatus() != EnrollmentStatus.APPROVED) {
                throw new ObsException(ErrorCode.VALIDATION_ERROR,
                        "Cannot record attendance for non-approved enrollment of student "
                                + attendanceDto.getStudentId());
            }

            // Find existing record for this date or create new
            AttendanceRecord record = attendanceRecordRepository
                    .findByEnrollmentCourseIdAndAttendanceDate(courseId, request.getAttendanceDate()).stream()
                    .filter(r -> r.getEnrollment().getId().equals(enrollment.getId()))
                    .findFirst()
                    .orElse(AttendanceRecord.builder()
                            .enrollment(enrollment)
                            .attendanceDate(request.getAttendanceDate())
                            .build());

            record.setPresent(attendanceDto.isPresent());
            attendanceRecordRepository.save(record);
        }
    }

    @Override
    public List<AttendanceEntryRequest.StudentAttendanceDTO> getTodayAttendance(Long courseId) {
        LocalDate todayDate = LocalDate.now();
        List<AttendanceRecord> records = attendanceRecordRepository.findByEnrollmentCourseIdAndAttendanceDate(courseId,
                todayDate);
        List<Enrollment> enrollments = enrollmentRepository.findByCourseIdAndStatus(courseId,
                EnrollmentStatus.APPROVED);

        return enrollments.stream()
                .filter(e -> e.getStatus() == EnrollmentStatus.APPROVED)
                .map((Enrollment e) -> {
                    boolean isPresentValue = records.stream()
                            .filter(r -> r.getEnrollment().getId().equals(e.getId()))
                            .findFirst()
                            .map(AttendanceRecord::isPresent)
                            .orElse(false);
                    return AttendanceEntryRequest.StudentAttendanceDTO.builder()
                            .studentId(e.getStudent().getId())
                            .isPresent(isPresentValue)
                            .build();
                }).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void openCourse(@lombok.NonNull Long courseId, @lombok.NonNull CourseOpenRequest request) {
        Academician currentHoca = getCurrentAcademician();
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ObsException(ErrorCode.RESOURCE_NOT_FOUND, "Course not found"));

        if (course.getInstructor() == null || !course.getInstructor().getId().equals(currentHoca.getId())) {
            throw new ObsException(ErrorCode.ACCESS_DENIED, "You are not the instructor of this course");
        }

        // Rule 1: Syllabus check
        if (course.getSyllabus() == null || course.getSyllabus().trim().isEmpty()) {
            throw new ObsException(ErrorCode.VALIDATION_ERROR, "Cannot open course without a syllabus");
        }

        // Rule 2: Active AKTS Load Check (Max 30)
        Semester activeSemester = semesterRepository.findAll().stream()
                .filter(Semester::isActive)
                .findFirst()
                .orElseThrow(() -> new ObsException(ErrorCode.RESOURCE_NOT_FOUND, "No active semester found"));

        int currentAktsLoad = courseRepository.findByInstructorId(currentHoca.getId()).stream()
                .filter(Course::isOpen)
                .mapToInt(Course::getAkts)
                .sum();

        if (currentAktsLoad + course.getAkts() > 30) {
            throw new ObsException(ErrorCode.VALIDATION_ERROR,
                    "Total AKTS load exceeds limit (Max 30, Current: " + currentAktsLoad + ")");
        }

        // Rule 3: Exam Ratio Check (Exactly 100%)
        List<Exam> exams = examRepository.findByCourseId(courseId);
        double totalRatio = exams.stream()
                .filter(e -> e.getSemester().getId().equals(activeSemester.getId()))
                .mapToDouble(Exam::getRatio)
                .sum();

        if (Math.abs(totalRatio - 100.0) > 0.01) {
            throw new ObsException(ErrorCode.VALIDATION_ERROR,
                    "Total exam ratios must be exactly 100% before opening the course (Current: " + totalRatio + "%)");
        }

        course.setOpen(true);
        course.setQuota(request.getQuota());
        courseRepository.save(course);
    }

    @Override
    @Transactional
    public void sendMessageToAdvisee(@lombok.NonNull Long studentId, @lombok.NonNull AdviseeMessageRequest request) {
        Academician currentHoca = getCurrentAcademician();
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new ObsException(ErrorCode.RESOURCE_NOT_FOUND, "Student not found"));

        if (student.getAdvisor() == null || !student.getAdvisor().getId().equals(currentHoca.getId())) {
            throw new ObsException(ErrorCode.ACCESS_DENIED, "This student is not your advisee");
        }

        ChatMessage message = ChatMessage.builder()
                .content(request.getContent())
                .timestamp(java.time.LocalDateTime.now())
                .sender(userRepository.findById(currentHoca.getId()).orElseThrow())
                .receiver(student)
                .isRead(false)
                .build();

        chatMessageRepository.save(message);
    }

    private Academician getCurrentAcademician() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) {
            throw new ObsException(ErrorCode.ACCESS_DENIED, "No active authentication found");
        }
        String username = auth.getName();
        return academicianRepository.findByUsername(username)
                .orElseThrow(() -> new ObsException(ErrorCode.ACCESS_DENIED,
                        "Academician profile not found for user: " + username));
    }

    // Phase 3 Implementations
    @Override
    public List<com.obs.backend.dto.academician.PendingEnrollmentDTO> getPendingAdviseeEnrollments() {
        Academician me = getCurrentAcademician();
        return enrollmentRepository.findByStudentAdvisorIdAndStatus(me.getId(), EnrollmentStatus.PENDING)
                .stream()
                .map(enrollment -> com.obs.backend.dto.academician.PendingEnrollmentDTO.builder()
                        .id(enrollment.getId())
                        .studentName(
                                enrollment.getStudent().getFirstName() + " " + enrollment.getStudent().getLastName())
                        .courseName(enrollment.getCourse().getName())
                        .courseCode(enrollment.getCourse().getCode())
                        .build())
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void approveEnrollment(@lombok.NonNull Long enrollmentId) {
        Enrollment enrollment = getAndVerifyAdviseeEnrollment(enrollmentId);
        enrollment.setStatus(EnrollmentStatus.APPROVED);
        enrollmentRepository.save(enrollment);
    }

    @Override
    @Transactional
    public void rejectEnrollment(@lombok.NonNull Long enrollmentId) {
        Enrollment enrollment = getAndVerifyAdviseeEnrollment(enrollmentId);
        enrollmentRepository.delete(enrollment);
    }

    @Override
    @Transactional
    public void postAnnouncement(@lombok.NonNull Long courseId, @lombok.NonNull AnnouncementRequest request) {
        Academician me = getCurrentAcademician();
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ObsException(ErrorCode.RESOURCE_NOT_FOUND, "Course not found"));

        if (course.getInstructor() == null || !course.getInstructor().getId().equals(me.getId())) {
            throw new ObsException(ErrorCode.ACCESS_DENIED, "You are not the instructor of this course");
        }

        Announcement announcement = Announcement.builder()
                .title(request.getTitle())
                .content(request.getContent())
                .course(course)
                .timestamp(java.time.LocalDateTime.now())
                .build();

        announcementRepository.save(announcement);

        // Notify all enrolled students
        List<Enrollment> enrollments = enrollmentRepository.findByCourseIdAndStatus(courseId,
                EnrollmentStatus.APPROVED);
        List<Notification> notifications = enrollments.stream()
                .filter(e -> e.getStatus() == EnrollmentStatus.APPROVED)
                .map(e -> Notification.builder()
                        .user(e.getStudent())
                        .title("[" + course.getCode() + "] Course Announcement")
                        .message(request.getTitle() + ": "
                                + (request.getContent().length() > 50 ? request.getContent().substring(0, 47) + "..."
                                        : request.getContent()))
                        .build())
                .collect(Collectors.toList());
        notificationRepository.saveAll(notifications);
    }

    @Override
    public List<Announcement> getCourseAnnouncements(@lombok.NonNull Long courseId) {
        // Anyone can view announcements of a course (keeping it simple)
        return announcementRepository.findByCourseIdOrderByTimestampDesc(courseId);
    }

    @Override
    @Transactional
    public void setOfficeHours(List<OfficeHourRequest> requests) {
        Academician me = getCurrentAcademician();

        // Clear old ones first for simplicity
        List<OfficeHour> oldHours = officeHourRepository.findByAcademicianIdOrderByDayOfWeekAscStartTimeAsc(me.getId());
        officeHourRepository.deleteAll(oldHours);

        List<OfficeHour> newHours = requests.stream()
                .map(req -> OfficeHour.builder()
                        .dayOfWeek(req.getDayOfWeek())
                        .startTime(req.getStartTime())
                        .endTime(req.getEndTime())
                        .academician(me)
                        .build())
                .collect(Collectors.toList());

        officeHourRepository.saveAll(newHours);
    }

    @Override
    public List<OfficeHour> getMyOfficeHours() {
        Academician me = getCurrentAcademician();
        return officeHourRepository.findByAcademicianIdOrderByDayOfWeekAscStartTimeAsc(me.getId());
    }

    @Override
    public CourseAnalyticsResponse getCourseAnalytics(@lombok.NonNull Long courseId) {
        Academician me = getCurrentAcademician();
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ObsException(ErrorCode.RESOURCE_NOT_FOUND, "Course not found"));

        if (course.getInstructor() == null || !course.getInstructor().getId().equals(me.getId())) {
            throw new ObsException(ErrorCode.ACCESS_DENIED, "You are not the instructor of this course");
        }

        List<Enrollment> enrollments = enrollmentRepository.findByCourseIdAndStatus(courseId, EnrollmentStatus.APPROVED)
                .stream()
                .filter(e -> e.getStatus() == EnrollmentStatus.APPROVED)
                .collect(Collectors.toList());

        if (enrollments.isEmpty()) {
            return CourseAnalyticsResponse.builder()
                    .totalStudents(0L)
                    .averageScore(0.0)
                    .passRate(0.0)
                    .build();
        }

        double totalScore = 0.0;
        double min = 100.0;
        double max = 0.0;
        long passed = 0;

        for (Enrollment e : enrollments) {
            double score = e.getScore() != null ? e.getScore() : 0.0;
            totalScore += score;
            if (score < min)
                min = score;
            if (score > max)
                max = score;
            if (score >= 50.0)
                passed++; // CC and above pass logic
        }

        return CourseAnalyticsResponse.builder()
                .totalStudents((long) enrollments.size())
                .averageScore(totalScore / enrollments.size())
                .minScore(min)
                .maxScore(max)
                .passedStudents(passed)
                .passRate((double) passed / enrollments.size() * 100.0)
                .build();
    }

    private Enrollment getAndVerifyAdviseeEnrollment(@lombok.NonNull Long enrollmentId) {
        Academician me = getCurrentAcademician();
        Enrollment enrollment = enrollmentRepository.findById(enrollmentId)
                .orElseThrow(() -> new ObsException(ErrorCode.RESOURCE_NOT_FOUND, "Enrollment not found"));

        if (enrollment.getStudent() == null || enrollment.getStudent().getAdvisor() == null
                || !enrollment.getStudent().getAdvisor().getId().equals(me.getId())) {
            throw new ObsException(ErrorCode.ACCESS_DENIED, "This student is not your advisee");
        }
        return enrollment;
    }

    @Override
    public String exportCourseGrades(@lombok.NonNull Long courseId) {
        Academician currentHoca = getCurrentAcademician();
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ObsException(ErrorCode.RESOURCE_NOT_FOUND, "Course not found"));

        if (course.getInstructor() == null || !course.getInstructor().getId().equals(currentHoca.getId())) {
            throw new ObsException(ErrorCode.ACCESS_DENIED, "You are not the instructor of this course");
        }

        List<Enrollment> enrollments = enrollmentRepository.findByCourseIdAndStatus(courseId,
                EnrollmentStatus.APPROVED);

        StringBuilder csv = new StringBuilder();
        csv.append("Student ID,Student Number,First Name,Last Name,Total Score,Grade\n");

        for (Enrollment e : enrollments) {
            csv.append(String.format("%d,%s,%s,%s,%.2f,%s\n",
                    e.getStudent().getId(),
                    e.getStudent().getStudentNumber(),
                    e.getStudent().getFirstName(),
                    e.getStudent().getLastName(),
                    e.getScore() != null ? e.getScore() : 0.0,
                    e.getGrade() != null ? e.getGrade() : "N/A"));
        }

        return csv.toString();
    }

    @Override
    public String exportAdviseeList() {
        Academician currentHoca = getCurrentAcademician();
        List<Student> advisees = studentRepository.findByAdvisorId(currentHoca.getId());

        StringBuilder csv = new StringBuilder();
        csv.append("Student Number,First Name,Last Name,Current Semester,GPA\n");

        for (Student s : advisees) {
            csv.append(String.format("%s,%s,%s,%d,%.2f\n",
                    s.getStudentNumber(),
                    s.getFirstName(),
                    s.getLastName(),
                    s.getCurrentSemester(),
                    s.getGpa() != null ? s.getGpa() : 0.0));
        }

        return csv.toString();
    }

    @Override
    public java.util.Map<String, List<AcademicianStudentDTO>> getAllStudentsGroupedByCourse() {
        Academician currentHoca = getCurrentAcademician();
        List<Course> myCourses = courseRepository.findByInstructorId(currentHoca.getId());

        java.util.Map<String, List<AcademicianStudentDTO>> groupedStudents = new java.util.HashMap<>();

        for (Course course : myCourses) {
            List<AcademicianStudentDTO> students = enrollmentRepository
                    .findByCourseIdAndStatus(course.getId(), EnrollmentStatus.APPROVED).stream()
                    .filter(e -> e.getStatus() == EnrollmentStatus.APPROVED)
                    .map(this::mapToAcademicianStudentDTO)
                    .collect(Collectors.toList());

            groupedStudents.put(course.getCode() + " - " + course.getName(), students);
        }

        return groupedStudents;
    }

    private AcademicianStudentDTO mapToAcademicianStudentDTO(Enrollment enrollment) {
        var student = enrollment.getStudent();
        List<AttendanceRecord> records = attendanceRecordRepository.findByEnrollmentId(enrollment.getId());
        double attendanceRate = 100.0;
        if (!records.isEmpty()) {
            long presentCount = records.stream().filter(AttendanceRecord::isPresent).count();
            attendanceRate = (double) presentCount / records.size() * 100.0;
        }

        return AcademicianStudentDTO.builder()
                .id(student.getId())
                .studentNumber(student.getStudentNumber())
                .firstName(student.getFirstName())
                .lastName(student.getLastName())
                .departmentName(student.getDepartment() != null ? student.getDepartment().getName() : "N/A")
                .currentSemester(student.getCurrentSemester())
                .gpa(student.getGpa())
                .attendanceRate(attendanceRate)
                .build();
    }
}
