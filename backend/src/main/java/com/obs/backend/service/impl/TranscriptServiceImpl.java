package com.obs.backend.service.impl;

import com.obs.backend.dto.student.*;
import com.obs.backend.exception.ErrorCode;
import com.obs.backend.exception.ObsException;
import com.obs.backend.model.Enrollment;
import com.obs.backend.model.Student;
import com.obs.backend.model.enums.EnrollmentStatus;
import com.obs.backend.repository.EnrollmentRepository;
import com.obs.backend.repository.StudentRepository;
import com.obs.backend.service.TranscriptService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TranscriptServiceImpl implements TranscriptService {

    private final StudentRepository studentRepository;
    private final EnrollmentRepository enrollmentRepository;

    private static final Map<String, Double> GRADE_POINTS = new HashMap<>();

    static {
        GRADE_POINTS.put("AA", 4.0);
        GRADE_POINTS.put("BA", 3.5);
        GRADE_POINTS.put("BB", 3.0);
        GRADE_POINTS.put("CB", 2.5);
        GRADE_POINTS.put("CC", 2.0);
        GRADE_POINTS.put("DC", 1.5);
        GRADE_POINTS.put("DD", 1.0);
        GRADE_POINTS.put("FD", 0.5);
        GRADE_POINTS.put("FF", 0.0);
    }

    @Override
    public TranscriptDTO getTranscript(String username) {
        Student student = studentRepository.findByUsername(username)
                .orElseThrow(() -> new ObsException(ErrorCode.RESOURCE_NOT_FOUND, "Student not found"));

        @lombok.NonNull Long studentId = student.getId();
        List<Enrollment> allEnrollments = enrollmentRepository.findByStudentIdAndStatus(studentId, EnrollmentStatus.APPROVED);

        // Group by Semester
        Map<String, List<Enrollment>> bySemester = allEnrollments.stream()
                .filter(e -> e.getGrade() != null && e.getSemester() != null && e.getCourse() != null)
                .collect(Collectors.groupingBy(e -> e.getSemester().getName()));

        List<SemesterTranscriptDTO> semesterDTOs = new ArrayList<>();
        double totalWeightedPoints = 0;
        int totalAkts = 0;

        for (Map.Entry<String, List<Enrollment>> entry : bySemester.entrySet()) {
            List<CourseGradeDTO> courses = entry.getValue().stream()
                    .map(e -> CourseGradeDTO.builder()
                            .courseCode(e.getCourse().getCode())
                            .courseName(e.getCourse().getName())
                            .credits(e.getCourse().getCredits())
                            .akts(e.getCourse().getAkts())
                            .grade(e.getGrade())
                            .build())
                    .collect(Collectors.toList());

            double semesterWeightedPoints = 0;
            int semesterAkts = 0;

            for (Enrollment e : entry.getValue()) {
                Double points = GRADE_POINTS.get(e.getGrade());
                if (points != null) {
                    semesterWeightedPoints += points * e.getCourse().getAkts();
                    semesterAkts += e.getCourse().getAkts();
                }
            }

            double ano = semesterAkts > 0 ? semesterWeightedPoints / semesterAkts : 0.0;
            totalWeightedPoints += semesterWeightedPoints;
            totalAkts += semesterAkts;

            boolean isActive = entry.getValue().get(0).getSemester().isActive();

            semesterDTOs.add(SemesterTranscriptDTO.builder()
                    .semesterName(entry.getKey())
                    .courses(courses)
                    .semesterGpa(ano)
                    .active(isActive)
                    .build());
        }

        double gno = totalAkts > 0 ? totalWeightedPoints / totalAkts : 0.0;

        return TranscriptDTO.builder()
                .studentName(student.getFirstName() + " " + student.getLastName())
                .studentNumber(student.getStudentNumber())
                .departmentName(student.getDepartment() != null ? student.getDepartment().getName() : "N/A")
                .semesters(semesterDTOs)
                .cumulativeGpa(gno)
                .build();
    }

    @Override
    public Double simulateGpa(String username, SimulationRequest request) {
        Student student = studentRepository.findByUsername(username)
                .orElseThrow(() -> new ObsException(ErrorCode.RESOURCE_NOT_FOUND, "Student not found"));

        @lombok.NonNull Long studentIdToSimulate = student.getId();
        List<Enrollment> allEnrollments = enrollmentRepository.findByStudentIdAndStatus(studentIdToSimulate, EnrollmentStatus.APPROVED);

        double totalWeightedPoints = 0;
        int totalAkts = 0;

        for (Enrollment e : allEnrollments) {
            String grade = e.getGrade();
            
            // If the grade is in simulation request, override it
            if (request.getHypotheticalGrades().containsKey(e.getCourse().getCode())) {
                grade = request.getHypotheticalGrades().get(e.getCourse().getCode());
            }

            if (grade != null) {
                Double points = GRADE_POINTS.get(grade);
                if (points != null) {
                    totalWeightedPoints += points * e.getCourse().getAkts();
                    totalAkts += e.getCourse().getAkts();
                }
            }
        }

        return totalAkts > 0 ? totalWeightedPoints / totalAkts : 0.0;
    }
}
