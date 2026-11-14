package com.obs.backend.registration;

import com.obs.backend.grading.CourseAttempt;
import com.obs.backend.grading.GpaCalculator;
import com.obs.backend.model.Course;
import com.obs.backend.model.Enrollment;
import com.obs.backend.model.Semester;

import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;

/**
 * The latest finalized letter of every course a student took before the active semester
 * (decision K5: the last grade counts). Grades of the active semester are not history yet.
 */
public final class AcademicHistory {

    private final Map<Long, String> latestLetterByCourse;
    private final Map<Long, Course> coursesById;

    private AcademicHistory(Map<Long, String> latestLetterByCourse, Map<Long, Course> coursesById) {
        this.latestLetterByCourse = latestLetterByCourse;
        this.coursesById = coursesById;
    }

    /** Builds the history from a student's approved enrollments. */
    public static AcademicHistory of(Collection<Enrollment> approved, Semester activeSemester, GpaCalculator gpaCalculator) {
        Map<Long, Course> coursesById = new LinkedHashMap<>();
        var earlier = approved.stream()
                .filter(e -> e.getCourse() != null && isEarlierThan(e.getSemester(), activeSemester))
                .peek(e -> coursesById.putIfAbsent(e.getCourse().getId(), e.getCourse()))
                .toList();

        Map<Long, String> latest = new LinkedHashMap<>();
        for (CourseAttempt attempt : gpaCalculator.latestPerCourse(gpaCalculator.countedAttempts(earlier))) {
            latest.put(attempt.courseId(), attempt.letter());
        }
        return new AcademicHistory(latest, coursesById);
    }

    private static boolean isEarlierThan(Semester semester, Semester activeSemester) {
        if (semester == null || semester.getId().equals(activeSemester.getId())) {
            return false;
        }
        // A semester that starts after the active one is not history yet
        return semester.getStartDate() == null || activeSemester.getStartDate() == null
                || semester.getStartDate().isBefore(activeSemester.getStartDate());
    }

    /** The latest finalized letter of a course, if the student finished it before. */
    public Optional<String> latestLetter(Long courseId) {
        return Optional.ofNullable(latestLetterByCourse.get(courseId));
    }

    /** Courses whose latest letter matches the given test, e.g. the failing ones. */
    public Map<Long, Course> coursesWhere(java.util.function.Predicate<String> letterTest) {
        Map<Long, Course> result = new LinkedHashMap<>();
        latestLetterByCourse.forEach((courseId, letter) -> {
            if (letterTest.test(letter)) {
                result.put(courseId, coursesById.get(courseId));
            }
        });
        return result;
    }
}
