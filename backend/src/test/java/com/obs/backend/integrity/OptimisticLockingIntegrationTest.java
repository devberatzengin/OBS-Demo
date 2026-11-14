package com.obs.backend.integrity;

import com.obs.backend.exception.GlobalExceptionHandler;
import com.obs.backend.model.*;
import com.obs.backend.model.enums.EnrollmentStatus;
import com.obs.backend.repository.EnrollmentRepository;
import com.obs.backend.support.AbstractIntegrationTest;
import com.obs.backend.support.TestDataFactory;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.orm.ObjectOptimisticLockingFailureException;

import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Plan 3.4: saving a stale copy fails instead of silently overwriting a newer change.
 * Not @Transactional: each save must commit on its own, like two separate requests.
 */
class OptimisticLockingIntegrationTest extends AbstractIntegrationTest {

    @Autowired private TestDataFactory data;
    @Autowired private EnrollmentRepository enrollmentRepository;
    @Autowired private GlobalExceptionHandler exceptionHandler;

    @Test
    void aStaleUpdateIsRejected() {
        Department department = data.department();
        Academician instructor = data.academician(department);
        Course course = data.course(department, instructor);
        // An inactive semester, so the committed data does not disturb other test classes
        Semester semester = data.pastSemester(LocalDate.now().minusYears(3));
        Student student = data.student(department, instructor);
        Long id = data.enrollment(student, course, semester, EnrollmentStatus.PENDING).getId();

        Enrollment first = enrollmentRepository.findById(id).orElseThrow();
        Enrollment second = enrollmentRepository.findById(id).orElseThrow();
        assertThat(first.getVersion()).isEqualTo(second.getVersion());

        first.setStatus(EnrollmentStatus.APPROVED);
        enrollmentRepository.save(first);

        second.setScore(55.0);
        assertThatThrownBy(() -> enrollmentRepository.save(second))
                .isInstanceOf(ObjectOptimisticLockingFailureException.class)
                .satisfies(ex -> assertThat(exceptionHandler
                        .handleOptimisticLock((ObjectOptimisticLockingFailureException) ex)
                        .getStatusCode()).isEqualTo(HttpStatus.CONFLICT));

        Enrollment stored = enrollmentRepository.findById(id).orElseThrow();
        assertThat(stored.getStatus()).isEqualTo(EnrollmentStatus.APPROVED);
        assertThat(stored.getScore()).as("the stale change must not be written").isNotEqualTo(55.0);
    }
}
