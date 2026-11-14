package com.obs.backend.integrity;

import com.obs.backend.model.*;
import com.obs.backend.model.enums.EnrollmentStatus;
import com.obs.backend.model.enums.ExamType;
import com.obs.backend.repository.*;
import com.obs.backend.support.AbstractIntegrationTest;
import com.obs.backend.support.TestDataFactory;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Plan 3.3: the database itself rejects duplicates and out-of-range values, even when a
 * service check is skipped or two requests race. The API maps these errors to 409.
 */
@Transactional
class DatabaseConstraintsIntegrationTest extends AbstractIntegrationTest {

    @Autowired private TestDataFactory data;
    @Autowired private EnrollmentRepository enrollmentRepository;
    @Autowired private GradeRepository gradeRepository;
    @Autowired private AttendanceRecordRepository attendanceRecordRepository;
    @Autowired private SemesterRepository semesterRepository;
    @Autowired private ExamRepository examRepository;
    @Autowired private CourseRepository courseRepository;

    private Course course;
    private Semester active;
    private Student student;
    private Enrollment enrollment;

    @BeforeEach
    void setUp() {
        Department department = data.department();
        Academician instructor = data.academician(department);
        course = data.course(department, instructor);
        active = data.activeSemester();
        student = data.student(department, instructor);
        enrollment = data.enrollment(student, course, active, EnrollmentStatus.APPROVED);
    }

    @Test
    void aStudentCannotBeEnrolledTwiceInTheSameCourseAndSemester() {
        assertThatThrownBy(() -> enrollmentRepository.saveAndFlush(Enrollment.builder()
                .student(student).course(course).semester(active).build()))
                .isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    void aRetakeInAnotherSemesterIsAllowed() {
        Semester lastYear = data.pastSemester(LocalDate.now().minusYears(1));
        enrollmentRepository.saveAndFlush(Enrollment.builder()
                .student(student).course(course).semester(lastYear).status(EnrollmentStatus.APPROVED).build());
    }

    @Test
    void anExamHasOneScorePerEnrollment() {
        Exam exam = data.exam(course, active, ExamType.MIDTERM, 40);
        data.score(enrollment, exam, 70);

        assertThatThrownBy(() -> gradeRepository.saveAndFlush(
                Grade.builder().enrollment(enrollment).exam(exam).score(80.0).build()))
                .isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    void scoresStayBetween0And100() {
        Exam exam = data.exam(course, active, ExamType.MIDTERM, 40);

        assertThatThrownBy(() -> gradeRepository.saveAndFlush(
                Grade.builder().enrollment(enrollment).exam(exam).score(101.0).build()))
                .isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    void attendanceIsRecordedOncePerDay() {
        LocalDate today = LocalDate.now();
        attendanceRecordRepository.saveAndFlush(AttendanceRecord.builder()
                .enrollment(enrollment).attendanceDate(today).isPresent(true).build());

        assertThatThrownBy(() -> attendanceRecordRepository.saveAndFlush(AttendanceRecord.builder()
                .enrollment(enrollment).attendanceDate(today).isPresent(false).build()))
                .isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    void onlyOneSemesterCanBeActive() {
        assertThatThrownBy(() -> semesterRepository.saveAndFlush(
                Semester.builder().name("Second active " + System.nanoTime()).isActive(true).build()))
                .isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    void anExamWeightMustBePositiveAndAtMost100() {
        assertThatThrownBy(() -> examRepository.saveAndFlush(Exam.builder()
                .examType(ExamType.QUIZ).examDate(LocalDateTime.now()).ratio(0.0)
                .course(course).classroom(data.classroom()).semester(active).build()))
                .isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    void aCourseNeedsPositiveAkts() {
        course.setAkts(0);
        assertThatThrownBy(() -> courseRepository.saveAndFlush(course))
                .isInstanceOf(DataIntegrityViolationException.class);
    }
}
