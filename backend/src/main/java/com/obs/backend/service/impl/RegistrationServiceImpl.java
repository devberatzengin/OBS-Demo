package com.obs.backend.service.impl;

import com.obs.backend.dto.registration.RegistrationRequest;
import com.obs.backend.dto.student.CourseDTO;
import com.obs.backend.exception.ErrorCode;
import com.obs.backend.exception.ObsException;
import com.obs.backend.grading.CourseAttempt;
import com.obs.backend.grading.GpaCalculator;
import com.obs.backend.grading.GradingPolicy;
import com.obs.backend.model.*;
import com.obs.backend.model.enums.EnrollmentStatus;
import com.obs.backend.repository.*;
import com.obs.backend.service.RegistrationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RegistrationServiceImpl implements RegistrationService {

    private final StudentRepository studentRepository;
    private final CourseRepository courseRepository;
    private final SemesterRepository semesterRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final ScheduleRepository scheduleRepository;
    private final GpaCalculator gpaCalculator;
    private final GradingPolicy gradingPolicy;

    @Override
    public List<CourseDTO> getAvailableCourses(String username) {
        Student student = studentRepository.findByUsername(username)
                .orElseThrow(() -> new ObsException(ErrorCode.RESOURCE_NOT_FOUND, "Student not found"));

        Semester activeSemester = semesterRepository.findByIsActiveTrue()
                .orElseThrow(() -> new ObsException(ErrorCode.RESOURCE_NOT_FOUND, "Active semester not found"));

        java.util.Map<Long, String> enrolledCourseStatusMap = enrollmentRepository.findByStudentIdAndSemesterId(student.getId(), activeSemester.getId())
                .stream().collect(Collectors.toMap(e -> e.getCourse().getId(), e -> e.getStatus().name()));

        Set<Long> failedCourseIds = mandatoryRetakes(student, activeSemester).keySet();

        // Get courses from student's department
        return courseRepository.findByDepartmentId(student.getDepartment().getId())
                .stream()
                .map(c -> CourseDTO.builder()
                        .id(c.getId())
                        .code(c.getCode())
                        .name(c.getName())
                        .akts(c.getAkts())
                        .credits(c.getCredits())
                        .instructorName(c.getInstructor() != null ? c.getInstructor().getFirstName() + " " + c.getInstructor().getLastName() : "N/A")
                        .registered(enrolledCourseStatusMap.containsKey(c.getId()))
                        .mandatory(failedCourseIds.contains(c.getId()))
                        .status(enrolledCourseStatusMap.get(c.getId()))
                        .build())
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void enrollCourses(String username, RegistrationRequest request) {
        Student student = studentRepository.findByUsername(username)
                .orElseThrow(() -> new ObsException(ErrorCode.RESOURCE_NOT_FOUND, "Student not found"));

        Semester activeSemester = semesterRepository.findByIsActiveTrue()
                .orElseThrow(() -> new ObsException(ErrorCode.BAD_REQUEST, "No active semester for registration"));

        @lombok.NonNull List<Long> courseIds = request.getCourseIds();
        List<Course> selectedCourses = courseRepository.findAllById(courseIds);

        // 1. Mandatory Check: Alttan kalan dersler (FF) kontrolü
        validateMandatoryCourses(student, activeSemester, selectedCourses);

        // 2. AKTS Limit Check (30 AKTS)
        validateAktsLimit(selectedCourses);

        // 3. Conflict Check
        validateScheduleConflicts(selectedCourses);

        for (Course course : selectedCourses) {
            @lombok.NonNull Enrollment enrollment = Enrollment.builder()
                    .student(student)
                    .course(course)
                    .semester(activeSemester)
                    .build();
            enrollmentRepository.save(enrollment);
        }
    }

    /**
     * Plan 2.4: a course must be re-taken when the latest finalized, approved attempt from an
     * earlier semester is failing (decision K5: the last grade counts; only FF fails). A later
     * pass removes it; grades of the active semester never make a course mandatory.
     */
    private Map<Long, Course> mandatoryRetakes(Student student, Semester activeSemester) {
        List<Enrollment> earlier = enrollmentRepository.findByStudentIdAndStatus(student.getId(), EnrollmentStatus.APPROVED)
                .stream()
                .filter(e -> e.getCourse() != null && isEarlierThan(e.getSemester(), activeSemester))
                .collect(Collectors.toList());

        Map<Long, Course> coursesById = new LinkedHashMap<>();
        earlier.forEach(e -> coursesById.putIfAbsent(e.getCourse().getId(), e.getCourse()));

        Map<Long, Course> mandatory = new LinkedHashMap<>();
        for (CourseAttempt latest : gpaCalculator.latestPerCourse(gpaCalculator.countedAttempts(earlier))) {
            if (gradingPolicy.isFailing(latest.letter())) {
                mandatory.put(latest.courseId(), coursesById.get(latest.courseId()));
            }
        }
        return mandatory;
    }

    private static boolean isEarlierThan(Semester semester, Semester activeSemester) {
        if (semester == null || semester.getId().equals(activeSemester.getId())) {
            return false;
        }
        // A semester that starts after the active one is not history yet
        return semester.getStartDate() == null || activeSemester.getStartDate() == null
                || semester.getStartDate().isBefore(activeSemester.getStartDate());
    }

    private void validateMandatoryCourses(Student student, Semester activeSemester, List<Course> selectedCourses) {
        Set<Long> covered = enrollmentRepository.findByStudentIdAndSemesterId(student.getId(), activeSemester.getId())
                .stream()
                .filter(e -> e.getStatus() != EnrollmentStatus.REJECTED)
                .map(e -> e.getCourse().getId())
                .collect(Collectors.toCollection(java.util.HashSet::new));
        selectedCourses.forEach(c -> covered.add(c.getId()));

        List<String> missing = mandatoryRetakes(student, activeSemester).entrySet().stream()
                .filter(entry -> !covered.contains(entry.getKey()))
                .map(entry -> entry.getValue().getCode())
                .sorted()
                .collect(Collectors.toList());

        if (!missing.isEmpty()) {
            throw new ObsException(ErrorCode.BAD_REQUEST,
                    "Failed courses must be re-taken: " + String.join(", ", missing));
        }
    }

    private void validateAktsLimit(List<Course> courses) {
        int totalAkts = courses.stream().mapToInt(Course::getAkts).sum();
        if (totalAkts > 30) {
            throw new ObsException(ErrorCode.BAD_REQUEST, "Total AKTS exceeds the limit of 30. Current: " + totalAkts);
        }
    }

    private void validateScheduleConflicts(List<Course> courses) {
        List<Long> courseIds = courses.stream().map(Course::getId).collect(Collectors.toList());
        List<Schedule> allSchedules = scheduleRepository.findByCourseIdIn(courseIds);

        for (int i = 0; i < allSchedules.size(); i++) {
            for (int j = i + 1; j < allSchedules.size(); j++) {
                Schedule s1 = allSchedules.get(i);
                Schedule s2 = allSchedules.get(j);

                if (isConflict(s1, s2)) {
                    throw new ObsException(ErrorCode.BAD_REQUEST, 
                        String.format("Schedule conflict: %s (%s %s-%s) and %s (%s %s-%s)", 
                            s1.getCourse().getCode(), s1.getDayOfWeek(), s1.getStartTime(), s1.getEndTime(),
                            s2.getCourse().getCode(), s2.getDayOfWeek(), s2.getStartTime(), s2.getEndTime()));
                }
            }
        }
    }

    @Override
    @Transactional
    public void registerCourse(String username, Long courseId) {
        Student student = studentRepository.findByUsername(username)
                .orElseThrow(() -> new ObsException(ErrorCode.RESOURCE_NOT_FOUND, "Student not found"));

        Semester activeSemester = semesterRepository.findByIsActiveTrue()
                .orElseThrow(() -> new ObsException(ErrorCode.BAD_REQUEST, "No active semester for registration"));

        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ObsException(ErrorCode.RESOURCE_NOT_FOUND, "Course not found"));

        // Check if already enrolled
        if (enrollmentRepository.findByStudentIdAndSemesterId(student.getId(), activeSemester.getId())
                .stream().anyMatch(e -> e.getCourse().getId().equals(courseId))) {
            throw new ObsException(ErrorCode.BAD_REQUEST, "Already registered for this course");
        }

        // Get currently selected courses to validate limits
        List<Course> currentCourses = enrollmentRepository.findByStudentIdAndSemesterId(student.getId(), activeSemester.getId())
                .stream().map(Enrollment::getCourse).collect(Collectors.toCollection(java.util.ArrayList::new));
        
        currentCourses.add(course);

        // Validations
        validateAktsLimit(currentCourses);
        validateScheduleConflicts(currentCourses);

        @lombok.NonNull Enrollment enrollment = Enrollment.builder()
                .student(student)
                .course(course)
                .semester(activeSemester)
                .build();
        enrollmentRepository.save(enrollment);
    }

    private boolean isConflict(Schedule s1, Schedule s2) {
        if (!s1.getDayOfWeek().equals(s2.getDayOfWeek())) {
            return false;
        }
        // Overlap logic: (Start1 < End2) AND (Start2 < End1)
        return s1.getStartTime().isBefore(s2.getEndTime()) && s2.getStartTime().isBefore(s1.getEndTime());
    }
}
