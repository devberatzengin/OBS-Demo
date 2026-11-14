package com.obs.backend.registration;

import com.obs.backend.dto.registration.RegistrationRequest;
import com.obs.backend.exception.ErrorCode;
import com.obs.backend.exception.ObsException;
import com.obs.backend.model.*;
import com.obs.backend.model.enums.EnrollmentStatus;
import com.obs.backend.repository.CourseRepository;
import com.obs.backend.repository.EnrollmentRepository;
import com.obs.backend.repository.SemesterRepository;
import com.obs.backend.service.RegistrationService;
import com.obs.backend.support.AbstractIntegrationTest;
import com.obs.backend.support.TestDataFactory;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.*;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Plan 3.2: concurrent registrations for the last place. Deliberately not @Transactional:
 * every registration must run in its own committed transaction, as it does in production.
 */
class QuotaConcurrencyIntegrationTest extends AbstractIntegrationTest {

    private static final int STUDENTS = 10;

    @Autowired private TestDataFactory data;
    @Autowired private RegistrationService registrationService;
    @Autowired private CourseRepository courseRepository;
    @Autowired private EnrollmentRepository enrollmentRepository;
    @Autowired private SemesterRepository semesterRepository;

    private Semester active;

    @AfterEach
    void releaseTheActiveSemester() {
        // The data is committed; leave no active semester behind for the other test classes
        if (active != null) {
            active.setActive(false);
            semesterRepository.save(active);
        }
    }

    @Test
    void onlyOneOfTenConcurrentRequestsGetsTheLastPlace() throws Exception {
        Department department = data.department();
        Academician instructor = data.academician(department);
        active = data.activeSemester();
        Course course = data.course(department, instructor);
        course.setQuota(1);
        courseRepository.save(course);

        List<Student> students = new ArrayList<>();
        for (int i = 0; i < STUDENTS; i++) {
            students.add(data.student(department, instructor));
        }

        ExecutorService pool = Executors.newFixedThreadPool(STUDENTS);
        CountDownLatch start = new CountDownLatch(1);
        List<Future<ErrorCode>> results = new ArrayList<>();
        try {
            for (Student student : students) {
                results.add(pool.submit(() -> {
                    start.await();
                    try {
                        registrationService.enrollCourses(student.getUsername(),
                                RegistrationRequest.builder().courseIds(List.of(course.getId())).build());
                        return null;
                    } catch (ObsException e) {
                        return e.getErrorCode();
                    }
                }));
            }
            start.countDown();

            int succeeded = 0;
            int quotaFull = 0;
            for (Future<ErrorCode> result : results) {
                ErrorCode code = result.get(30, TimeUnit.SECONDS);
                if (code == null) {
                    succeeded++;
                } else if (code == ErrorCode.QUOTA_FULL) {
                    quotaFull++;
                }
            }

            assertThat(succeeded).isEqualTo(1);
            assertThat(quotaFull).isEqualTo(STUDENTS - 1);
            assertThat(enrollmentRepository.countByCourseIdAndSemesterIdAndStatusNot(
                    course.getId(), active.getId(), EnrollmentStatus.REJECTED)).isEqualTo(1);
        } finally {
            pool.shutdownNow();
        }
    }
}
