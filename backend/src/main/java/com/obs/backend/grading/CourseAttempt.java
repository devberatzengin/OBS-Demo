package com.obs.backend.grading;

import com.obs.backend.model.Enrollment;

import java.time.LocalDate;
import java.util.Comparator;

/**
 * One finished (or simulated) attempt at a course, reduced to what the GPA needs.
 * Keeps {@link GpaCalculator} independent of JPA entities.
 */
public record CourseAttempt(Long courseId, String courseCode, int akts, String letter,
                            LocalDate semesterStart, Long semesterId) {

    /** Earlier semesters first: by start date, then by id for semesters without dates. */
    public static final Comparator<CourseAttempt> CHRONOLOGICAL = Comparator
            .comparing(CourseAttempt::semesterStart, Comparator.nullsFirst(Comparator.naturalOrder()))
            .thenComparing(CourseAttempt::semesterId, Comparator.nullsFirst(Comparator.naturalOrder()));

    public static CourseAttempt of(Enrollment enrollment) {
        return new CourseAttempt(
                enrollment.getCourse().getId(),
                enrollment.getCourse().getCode(),
                enrollment.getCourse().getAkts(),
                enrollment.getGrade(),
                enrollment.getSemester().getStartDate(),
                enrollment.getSemester().getId());
    }

    /** The same attempt with another letter, used by the what-if simulation. */
    public CourseAttempt withLetter(String newLetter) {
        return new CourseAttempt(courseId, courseCode, akts, newLetter, semesterStart, semesterId);
    }
}
