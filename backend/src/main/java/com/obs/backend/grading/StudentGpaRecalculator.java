package com.obs.backend.grading;

import com.obs.backend.model.Enrollment;
import com.obs.backend.model.enums.EnrollmentStatus;
import com.obs.backend.model.Student;
import com.obs.backend.repository.EnrollmentRepository;
import com.obs.backend.repository.StudentRepository;
import org.springframework.stereotype.Component;

import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Keeps the stored Student.gpa in sync with the transcript (plan decision K2: computed when grades
 * are finalized, then stored). Uses the same GpaCalculator as the transcript, so the dashboard GPA
 * and the transcript GNO cannot drift apart. Null means no grade counts yet.
 */
@Component
public class StudentGpaRecalculator {

    private final GpaCalculator gpaCalculator;
    private final EnrollmentRepository enrollmentRepository;
    private final StudentRepository studentRepository;

    public StudentGpaRecalculator(GpaCalculator gpaCalculator,
                                  EnrollmentRepository enrollmentRepository,
                                  StudentRepository studentRepository) {
        this.gpaCalculator = gpaCalculator;
        this.enrollmentRepository = enrollmentRepository;
        this.studentRepository = studentRepository;
    }

    /** The cumulative GPA (GNO) of a student from their approved enrollments. */
    public Double computeFor(Student student) {
        List<Enrollment> approved = enrollmentRepository.findByStudentIdAndStatus(student.getId(), EnrollmentStatus.APPROVED);
        return gpaCalculator.cumulative(gpaCalculator.countedAttempts(approved));
    }

    /** Recomputes and stores the GPA of one student. */
    public Double recalculate(Student student) {
        Double gpa = computeFor(student);
        student.setGpa(gpa);
        studentRepository.save(student);
        return gpa;
    }

    /** Recomputes the GPA of every distinct student among the given enrollments. */
    public void recalculateAll(Collection<Enrollment> enrollments) {
        Map<Long, Student> students = new LinkedHashMap<>();
        for (Enrollment enrollment : enrollments) {
            if (enrollment.getStudent() != null) {
                students.putIfAbsent(enrollment.getStudent().getId(), enrollment.getStudent());
            }
        }
        students.values().forEach(this::recalculate);
    }
}
