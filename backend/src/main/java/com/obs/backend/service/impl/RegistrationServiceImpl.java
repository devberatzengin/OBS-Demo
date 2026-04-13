package com.obs.backend.service.impl;

import com.obs.backend.dto.registration.RegistrationRequest;
import com.obs.backend.dto.student.CourseDTO;
import com.obs.backend.exception.ErrorCode;
import com.obs.backend.exception.ObsException;
import com.obs.backend.model.*;
import com.obs.backend.repository.*;
import com.obs.backend.service.RegistrationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RegistrationServiceImpl implements RegistrationService {

    private final StudentRepository studentRepository;
    private final CourseRepository courseRepository;
    private final SemesterRepository semesterRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final ScheduleRepository scheduleRepository;

    @Override
    public List<CourseDTO> getAvailableCourses(String username) {
        Student student = studentRepository.findByUsername(username)
                .orElseThrow(() -> new ObsException(ErrorCode.RESOURCE_NOT_FOUND, "Student not found"));

        Semester activeSemester = semesterRepository.findByIsActiveTrue()
                .orElseThrow(() -> new ObsException(ErrorCode.RESOURCE_NOT_FOUND, "Active semester not found"));

        java.util.Map<Long, String> enrolledCourseStatusMap = enrollmentRepository.findByStudentIdAndSemesterId(student.getId(), activeSemester.getId())
                .stream().collect(Collectors.toMap(e -> e.getCourse().getId(), e -> e.getStatus().name()));

        // Get failed course IDs from ANY previous semester
        java.util.Set<Long> failedCourseIds = enrollmentRepository.findByStudentId(student.getId())
                .stream()
                .filter(e -> "FF".equals(e.getGrade()))
                .map(e -> e.getCourse().getId())
                .collect(java.util.stream.Collectors.toSet());

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
        validateMandatoryCourses(student, selectedCourses);

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

    private void validateMandatoryCourses(Student student, List<Course> selectedCourses) {
        List<Enrollment> failedEnrollments = enrollmentRepository.findByStudentId(student.getId())
                .stream()
                .filter(e -> "FF".equals(e.getGrade()))
                .collect(Collectors.toList());

        for (Enrollment failed : failedEnrollments) {
            boolean isReSelected = selectedCourses.stream()
                    .anyMatch(c -> c.getId().equals(failed.getCourse().getId()));
            
            if (!isReSelected) {
                throw new ObsException(ErrorCode.BAD_REQUEST, 
                    "You must select failed course color-coded as mandatory: " + failed.getCourse().getCode());
            }
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
