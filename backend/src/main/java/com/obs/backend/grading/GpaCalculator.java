package com.obs.backend.grading;

import com.obs.backend.model.Enrollment;
import org.springframework.stereotype.Component;

import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.function.BinaryOperator;
import java.util.stream.Collectors;

/**
 * ECTS-weighted GPA. The single place that turns letter grades into ANO (semester) and GNO
 * (cumulative) values, used by the transcript, the simulator and the stored Student.gpa.
 */
@Component
public class GpaCalculator {

    private final GradingPolicy gradingPolicy;

    public GpaCalculator(GradingPolicy gradingPolicy) {
        this.gradingPolicy = gradingPolicy;
    }

    /**
     * ECTS-weighted average of the attempts whose letter carries points.
     * Returns null when nothing counts yet (e.g. a semester still in progress).
     */
    public Double average(Collection<CourseAttempt> attempts) {
        double weightedPoints = 0;
        int totalAkts = 0;
        for (CourseAttempt attempt : attempts) {
            Double points = gradingPolicy.pointsFor(attempt.letter());
            if (points != null && attempt.akts() > 0) {
                weightedPoints += points * attempt.akts();
                totalAkts += attempt.akts();
            }
        }
        return totalAkts == 0 ? null : weightedPoints / totalAkts;
    }

    /** Keeps only the most recent attempt of each course (plan decision K5: the last grade counts). */
    public List<CourseAttempt> latestPerCourse(Collection<CourseAttempt> attempts) {
        BinaryOperator<CourseAttempt> later = (a, b) -> CourseAttempt.CHRONOLOGICAL.compare(a, b) >= 0 ? a : b;
        Map<Long, CourseAttempt> latest = attempts.stream()
                .collect(Collectors.toMap(CourseAttempt::courseId, a -> a, later));
        return List.copyOf(latest.values());
    }

    /**
     * Whether an enrollment's grade counts towards the GPA: it must be finalized by the
     * instructor (plan decision K1) and carry a known letter. Callers pass approved enrollments.
     */
    public boolean counts(Enrollment enrollment) {
        return enrollment.isGradeFinalized() && gradingPolicy.isKnownLetter(enrollment.getGrade());
    }

    /** The counting attempts among the given enrollments. */
    public List<CourseAttempt> countedAttempts(Collection<Enrollment> enrollments) {
        return enrollments.stream().filter(this::counts).map(CourseAttempt::of).toList();
    }

    /** Cumulative GPA (GNO): the latest attempt of every course, ECTS-weighted. */
    public Double cumulative(Collection<CourseAttempt> attempts) {
        return average(latestPerCourse(attempts));
    }
}
