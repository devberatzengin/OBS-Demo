package com.obs.backend.service.impl;

import com.obs.backend.dto.student.*;
import com.obs.backend.exception.ErrorCode;
import com.obs.backend.exception.ObsException;
import com.obs.backend.grading.CourseAttempt;
import com.obs.backend.grading.GpaCalculator;
import com.obs.backend.grading.GradingPolicy;
import com.obs.backend.model.Enrollment;
import com.obs.backend.model.Semester;
import com.obs.backend.model.Student;
import com.obs.backend.model.enums.EnrollmentStatus;
import com.obs.backend.repository.EnrollmentRepository;
import com.obs.backend.repository.StudentRepository;
import com.obs.backend.service.TranscriptService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TranscriptServiceImpl implements TranscriptService {

    private final StudentRepository studentRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final GpaCalculator gpaCalculator;
    private final GradingPolicy gradingPolicy;

    @Override
    public TranscriptDTO getTranscript(String username) {
        Student student = findStudent(username);
        List<Enrollment> enrollments = approvedEnrollments(student);

        // Semesters in chronological order; courses without a counted grade are listed as in progress
        Map<Semester, List<Enrollment>> bySemester = enrollments.stream()
                .filter(e -> e.getSemester() != null && e.getCourse() != null)
                .collect(Collectors.groupingBy(Enrollment::getSemester, LinkedHashMap::new, Collectors.toList()));

        List<SemesterTranscriptDTO> semesterDTOs = bySemester.entrySet().stream()
                .sorted(Map.Entry.comparingByKey(Comparator
                        .comparing(Semester::getStartDate, Comparator.nullsFirst(Comparator.naturalOrder()))
                        .thenComparing(Semester::getId)))
                .map(entry -> SemesterTranscriptDTO.builder()
                        .semesterName(entry.getKey().getName())
                        .active(entry.getKey().isActive())
                        .courses(entry.getValue().stream().map(this::toCourseGrade).collect(Collectors.toList()))
                        .semesterGpa(gpaCalculator.average(countedAttempts(entry.getValue())))
                        .build())
                .collect(Collectors.toList());

        return TranscriptDTO.builder()
                .studentName(student.getFirstName() + " " + student.getLastName())
                .studentNumber(student.getStudentNumber())
                .departmentName(student.getDepartment() != null ? student.getDepartment().getName() : "N/A")
                .semesters(semesterDTOs)
                .cumulativeGpa(gpaCalculator.cumulative(countedAttempts(enrollments)))
                .build();
    }

    /**
     * Cumulative GPA if the given courses received the hypothetical letters. A hypothetical grade
     * replaces the student's latest attempt at that course, just like a real new grade would.
     */
    @Override
    public Double simulateGpa(String username, SimulationRequest request) {
        Student student = findStudent(username);
        Map<String, String> hypothetical = request.getHypotheticalGrades() == null
                ? Map.of() : request.getHypotheticalGrades();
        hypothetical.values().forEach(letter -> {
            if (!gradingPolicy.isKnownLetter(letter)) {
                throw new ObsException(ErrorCode.BAD_REQUEST, "Unknown letter grade: " + letter);
            }
        });

        List<Enrollment> enrollments = approvedEnrollments(student);
        List<CourseAttempt> attempts = new ArrayList<>(countedAttempts(enrollments));

        Map<String, CourseAttempt> latestByCode = gpaCalculator.latestPerCourse(
                        enrollments.stream().map(CourseAttempt::of).toList()).stream()
                .collect(Collectors.toMap(CourseAttempt::courseCode, a -> a));
        hypothetical.forEach((code, letter) -> {
            CourseAttempt latest = latestByCode.get(code);
            if (latest != null) {
                attempts.removeIf(a -> a.courseId().equals(latest.courseId()) && a.semesterId().equals(latest.semesterId()));
                attempts.add(latest.withLetter(letter));
            }
        });

        Double gpa = gpaCalculator.cumulative(attempts);
        return gpa == null ? 0.0 : gpa;
    }

    /** Attempts whose grade counts towards the GPA. */
    private List<CourseAttempt> countedAttempts(List<Enrollment> enrollments) {
        return enrollments.stream()
                .filter(this::countsTowardsGpa)
                .map(CourseAttempt::of)
                .toList();
    }

    private boolean countsTowardsGpa(Enrollment enrollment) {
        return gradingPolicy.isKnownLetter(enrollment.getGrade());
    }

    private CourseGradeDTO toCourseGrade(Enrollment e) {
        return CourseGradeDTO.builder()
                .courseCode(e.getCourse().getCode())
                .courseName(e.getCourse().getName())
                .credits(e.getCourse().getCredits())
                .akts(e.getCourse().getAkts())
                .grade(countsTowardsGpa(e) ? e.getGrade() : null)
                .build();
    }

    private List<Enrollment> approvedEnrollments(Student student) {
        return enrollmentRepository.findByStudentIdAndStatus(student.getId(), EnrollmentStatus.APPROVED);
    }

    private Student findStudent(String username) {
        return studentRepository.findByUsername(username)
                .orElseThrow(() -> new ObsException(ErrorCode.RESOURCE_NOT_FOUND, "Student not found"));
    }
}
