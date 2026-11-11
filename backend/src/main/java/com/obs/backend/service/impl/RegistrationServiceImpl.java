package com.obs.backend.service.impl;

import com.obs.backend.dto.registration.RegistrationRequest;
import com.obs.backend.dto.student.CourseDTO;
import com.obs.backend.exception.ErrorCode;
import com.obs.backend.exception.ObsException;
import com.obs.backend.model.*;
import com.obs.backend.model.enums.EnrollmentStatus;
import com.obs.backend.registration.AcademicHistory;
import com.obs.backend.registration.EnrollmentValidator;
import com.obs.backend.registration.EnrollmentValidator.RegistrationAttempt;
import com.obs.backend.repository.*;
import com.obs.backend.service.RegistrationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

/** Course registration. Both endpoints go through {@link #enrollCourses} and the same rules (plan 3.1). */
@Service
@RequiredArgsConstructor
public class RegistrationServiceImpl implements RegistrationService {

    private final StudentRepository studentRepository;
    private final CourseRepository courseRepository;
    private final SemesterRepository semesterRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final EnrollmentValidator enrollmentValidator;

    @Override
    public List<CourseDTO> getAvailableCourses(String username) {
        Student student = findStudent(username);
        Semester activeSemester = semesterRepository.findByIsActiveTrue()
                .orElseThrow(() -> new ObsException(ErrorCode.RESOURCE_NOT_FOUND, "Active semester not found"));

        Map<Long, Enrollment> thisSemester = enrollmentRepository.findByStudentIdAndSemesterId(student.getId(), activeSemester.getId())
                .stream()
                .collect(Collectors.toMap(e -> e.getCourse().getId(), Function.identity(),
                        // A rejected request and a newer one for the same course: show the newer one
                        (a, b) -> a.getStatus() == EnrollmentStatus.REJECTED ? b : a));
        AcademicHistory history = enrollmentValidator.historyOf(student, activeSemester);
        Set<Long> mandatory = enrollmentValidator.mandatoryRetakes(history).keySet();

        if (student.getDepartment() == null) {
            return List.of();
        }
        // Open courses of the department, plus anything the student already asked for this semester
        return courseRepository.findByDepartmentId(student.getDepartment().getId())
                .stream()
                .filter(c -> c.isOpen() || thisSemester.containsKey(c.getId()))
                .map(c -> {
                    Enrollment enrollment = thisSemester.get(c.getId());
                    boolean registered = enrollment != null && enrollment.getStatus() != EnrollmentStatus.REJECTED;
                    boolean hasQuota = EnrollmentValidator.hasQuota(c);
                    return CourseDTO.builder()
                            .id(c.getId())
                            .code(c.getCode())
                            .name(c.getName())
                            .akts(c.getAkts())
                            .credits(c.getCredits())
                            .instructorName(c.getInstructor() != null ? c.getInstructor().getFirstName() + " " + c.getInstructor().getLastName() : "N/A")
                            .grade(history.latestLetter(c.getId()).orElse(null))
                            .registered(registered)
                            .mandatory(mandatory.contains(c.getId()))
                            .passed(enrollmentValidator.isPassedForGood(history, c.getId()))
                            .quota(hasQuota ? c.getQuota() : null)
                            .enrolledCount(hasQuota ? enrollmentValidator.takenPlaces(c, activeSemester) : null)
                            .status(enrollment != null ? enrollment.getStatus().name() : null)
                            .build();
                })
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void enrollCourses(String username, RegistrationRequest request) {
        Student student = findStudent(username);
        Semester activeSemester = semesterRepository.findByIsActiveTrue()
                .orElseThrow(() -> new ObsException(ErrorCode.REGISTRATION_CLOSED, "No active semester for registration"));

        List<Long> courseIds = request == null || request.getCourseIds() == null ? List.of() : request.getCourseIds();
        if (courseIds.isEmpty() || courseIds.contains(null)) {
            throw new ObsException(ErrorCode.VALIDATION_ERROR, "Select at least one course");
        }

        // Keep the request order and duplicates, so a course sent twice is reported as already registered
        Map<Long, Course> found = courseRepository.findAllById(new LinkedHashSet<>(courseIds)).stream()
                .collect(Collectors.toMap(Course::getId, Function.identity()));
        List<Long> unknown = courseIds.stream().filter(id -> !found.containsKey(id)).distinct().toList();
        if (!unknown.isEmpty()) {
            throw new ObsException(ErrorCode.RESOURCE_NOT_FOUND, "Course not found: " + unknown);
        }
        List<Course> requested = courseIds.stream().map(found::get).toList();

        RegistrationAttempt attempt = enrollmentValidator.prepare(student, activeSemester, requested);
        enrollmentValidator.validate(attempt);

        Map<Long, Enrollment> rejected = enrollmentRepository.findByStudentIdAndSemesterId(student.getId(), activeSemester.getId())
                .stream()
                .filter(e -> e.getStatus() == EnrollmentStatus.REJECTED)
                .collect(Collectors.toMap(e -> e.getCourse().getId(), Function.identity(), (a, b) -> a));

        for (Course course : requested) {
            // Asking again after a rejection reuses the row: one enrollment per student, course and semester
            Enrollment enrollment = rejected.get(course.getId());
            if (enrollment != null) {
                enrollment.setStatus(EnrollmentStatus.PENDING);
            } else {
                enrollment = Enrollment.builder()
                        .student(student)
                        .course(course)
                        .semester(activeSemester)
                        .build();
            }
            enrollmentRepository.save(enrollment);
        }
    }

    @Override
    @Transactional
    public void registerCourse(String username, Long courseId) {
        enrollCourses(username, RegistrationRequest.builder().courseIds(List.of(courseId)).build());
    }

    private Student findStudent(String username) {
        return studentRepository.findByUsername(username)
                .orElseThrow(() -> new ObsException(ErrorCode.RESOURCE_NOT_FOUND, "Student not found"));
    }
}
