package com.obs.backend.registration;

import com.obs.backend.exception.ErrorCode;
import com.obs.backend.exception.ObsException;
import com.obs.backend.grading.GpaCalculator;
import com.obs.backend.grading.GradingPolicy;
import com.obs.backend.model.*;
import com.obs.backend.model.enums.EnrollmentStatus;
import com.obs.backend.repository.EnrollmentRepository;
import com.obs.backend.repository.ScheduleRepository;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.Stream;

/**
 * The one set of course registration rules (plan 3.1), shared by every registration endpoint.
 * Rules run in a fixed order and the first broken rule ends the check with its own error code.
 */
@Component
public class EnrollmentValidator {

    public static final int AKTS_LIMIT = 30;

    /** One registration rule; throws an ObsException with the rule's error code when broken. */
    @FunctionalInterface
    interface EnrollmentRule {
        void check(RegistrationAttempt attempt);
    }

    /**
     * What a student wants to add in the active semester, next to what they already have.
     * {@code current} holds the student's non-rejected enrollments of the active semester.
     */
    public record RegistrationAttempt(Student student, Semester semester, List<Course> requested,
                                      List<Enrollment> current, AcademicHistory history) {
    }

    private final EnrollmentRepository enrollmentRepository;
    private final ScheduleRepository scheduleRepository;
    private final GpaCalculator gpaCalculator;
    private final GradingPolicy gradingPolicy;

    private final List<EnrollmentRule> rules = List.of(
            this::registrationPeriodIsOpen,
            this::coursesAreOpen,
            this::coursesBelongToDepartment,
            this::notAlreadyRegistered,
            this::notAlreadyPassed,
            this::mandatoryRetakesIncluded,
            this::aktsWithinLimit,
            this::noScheduleConflict,
            this::quotaAvailable);

    public EnrollmentValidator(EnrollmentRepository enrollmentRepository, ScheduleRepository scheduleRepository,
                               GpaCalculator gpaCalculator, GradingPolicy gradingPolicy) {
        this.enrollmentRepository = enrollmentRepository;
        this.scheduleRepository = scheduleRepository;
        this.gpaCalculator = gpaCalculator;
        this.gradingPolicy = gradingPolicy;
    }

    /** The finalized grades a student brings into the active semester. */
    public AcademicHistory historyOf(Student student, Semester activeSemester) {
        return AcademicHistory.of(
                enrollmentRepository.findByStudentIdAndStatus(student.getId(), EnrollmentStatus.APPROVED),
                activeSemester, gpaCalculator);
    }

    public RegistrationAttempt prepare(Student student, Semester activeSemester, List<Course> requested) {
        List<Enrollment> current = enrollmentRepository.findByStudentIdAndSemesterId(student.getId(), activeSemester.getId())
                .stream()
                .filter(e -> e.getStatus() != EnrollmentStatus.REJECTED)
                .collect(Collectors.toList());
        return new RegistrationAttempt(student, activeSemester, requested, current, historyOf(student, activeSemester));
    }

    public void validate(RegistrationAttempt attempt) {
        rules.forEach(rule -> rule.check(attempt));
    }

    /** Courses the student must take again: the latest earlier attempt is failing (plan 2.4). */
    public Map<Long, Course> mandatoryRetakes(AcademicHistory history) {
        return history.coursesWhere(gradingPolicy::isFailing);
    }

    /** Whether a finished course is closed for registration: passed with a letter that may not be raised (K7). */
    public boolean isPassedForGood(AcademicHistory history, Long courseId) {
        return history.latestLetter(courseId).map(letter -> !gradingPolicy.mayRetake(letter)).orElse(false);
    }

    /** Places taken in a course this semester; pending requests hold a place until rejected. */
    public long takenPlaces(Course course, Semester semester) {
        return enrollmentRepository.countByCourseIdAndSemesterIdAndStatusNot(
                course.getId(), semester.getId(), EnrollmentStatus.REJECTED);
    }

    /** Null and 0 mean the course has no quota (plan decision K8). */
    public static boolean hasQuota(Course course) {
        return course.getQuota() != null && course.getQuota() > 0;
    }

    // ---- rules, in the order they run ----

    /** Missing dates leave that side of the period open (plan decision K9). */
    private void registrationPeriodIsOpen(RegistrationAttempt attempt) {
        Semester semester = attempt.semester();
        LocalDate today = LocalDate.now();
        LocalDate start = semester.getRegistrationStartDate();
        LocalDate end = semester.getRegistrationEndDate();
        if ((start != null && today.isBefore(start)) || (end != null && today.isAfter(end))) {
            throw new ObsException(ErrorCode.REGISTRATION_CLOSED, "Course registration for " + semester.getName()
                    + " is open " + (start != null ? "from " + start + " " : "") + (end != null ? "until " + end : ""));
        }
    }

    private void coursesAreOpen(RegistrationAttempt attempt) {
        List<String> closed = codes(attempt.requested().stream().filter(c -> !c.isOpen()));
        if (!closed.isEmpty()) {
            throw new ObsException(ErrorCode.COURSE_NOT_OPEN, "Not open for registration this semester: " + String.join(", ", closed));
        }
    }

    private void coursesBelongToDepartment(RegistrationAttempt attempt) {
        Department department = attempt.student().getDepartment();
        List<String> foreign = codes(attempt.requested().stream()
                .filter(c -> department == null || c.getDepartment() == null
                        || !c.getDepartment().getId().equals(department.getId())));
        if (!foreign.isEmpty()) {
            throw new ObsException(ErrorCode.COURSE_NOT_IN_DEPARTMENT, "Not a course of your department: " + String.join(", ", foreign));
        }
    }

    private void notAlreadyRegistered(RegistrationAttempt attempt) {
        Set<Long> seen = attempt.current().stream().map(e -> e.getCourse().getId()).collect(Collectors.toCollection(HashSet::new));
        List<String> duplicates = codes(attempt.requested().stream().filter(c -> !seen.add(c.getId())));
        if (!duplicates.isEmpty()) {
            throw new ObsException(ErrorCode.ALREADY_REGISTERED, "Already registered this semester: " + String.join(", ", duplicates));
        }
    }

    private void notAlreadyPassed(RegistrationAttempt attempt) {
        List<String> passed = codes(attempt.requested().stream().filter(c -> isPassedForGood(attempt.history(), c.getId())));
        if (!passed.isEmpty()) {
            throw new ObsException(ErrorCode.COURSE_ALREADY_PASSED,
                    "Already passed (only DD and DC can be retaken): " + String.join(", ", passed));
        }
    }

    private void mandatoryRetakesIncluded(RegistrationAttempt attempt) {
        Set<Long> covered = allCourses(attempt).map(Course::getId).collect(Collectors.toSet());
        List<String> missing = codes(mandatoryRetakes(attempt.history()).values().stream()
                .filter(c -> !covered.contains(c.getId())));
        if (!missing.isEmpty()) {
            throw new ObsException(ErrorCode.MANDATORY_COURSE_MISSING,
                    "Failed courses must be re-taken: " + String.join(", ", missing));
        }
    }

    private void aktsWithinLimit(RegistrationAttempt attempt) {
        int total = allCourses(attempt).mapToInt(c -> c.getAkts() != null ? c.getAkts() : 0).sum();
        if (total > AKTS_LIMIT) {
            throw new ObsException(ErrorCode.AKTS_LIMIT_EXCEEDED,
                    "Total AKTS exceeds the limit of " + AKTS_LIMIT + ". Current: " + total);
        }
    }

    private void noScheduleConflict(RegistrationAttempt attempt) {
        Set<Long> requestedIds = attempt.requested().stream().map(Course::getId).collect(Collectors.toSet());
        List<Long> courseIds = allCourses(attempt).map(Course::getId).distinct().collect(Collectors.toList());
        List<Schedule> schedules = scheduleRepository.findByCourseIdIn(courseIds);

        for (int i = 0; i < schedules.size(); i++) {
            for (int j = i + 1; j < schedules.size(); j++) {
                Schedule s1 = schedules.get(i);
                Schedule s2 = schedules.get(j);
                boolean involvesRequest = requestedIds.contains(s1.getCourse().getId())
                        || requestedIds.contains(s2.getCourse().getId());
                if (involvesRequest && !s1.getCourse().getId().equals(s2.getCourse().getId()) && overlaps(s1, s2)) {
                    throw new ObsException(ErrorCode.SCHEDULE_CONFLICT,
                            String.format("Schedule conflict: %s (%s %s-%s) and %s (%s %s-%s)",
                                    s1.getCourse().getCode(), s1.getDayOfWeek(), s1.getStartTime(), s1.getEndTime(),
                                    s2.getCourse().getCode(), s2.getDayOfWeek(), s2.getStartTime(), s2.getEndTime()));
                }
            }
        }
    }

    private void quotaAvailable(RegistrationAttempt attempt) {
        List<String> full = codes(attempt.requested().stream()
                .filter(EnrollmentValidator::hasQuota)
                .filter(c -> takenPlaces(c, attempt.semester()) >= c.getQuota()));
        if (!full.isEmpty()) {
            throw new ObsException(ErrorCode.QUOTA_FULL, "No places left in: " + String.join(", ", full));
        }
    }

    // ---- helpers ----

    private static Stream<Course> allCourses(RegistrationAttempt attempt) {
        return Stream.concat(attempt.current().stream().map(Enrollment::getCourse), attempt.requested().stream());
    }

    private static List<String> codes(Stream<Course> courses) {
        return courses.map(Course::getCode).distinct().sorted().collect(Collectors.toList());
    }

    private static boolean overlaps(Schedule s1, Schedule s2) {
        // (start1 < end2) and (start2 < end1) on the same day
        return s1.getDayOfWeek().equals(s2.getDayOfWeek())
                && s1.getStartTime().isBefore(s2.getEndTime()) && s2.getStartTime().isBefore(s1.getEndTime());
    }
}
