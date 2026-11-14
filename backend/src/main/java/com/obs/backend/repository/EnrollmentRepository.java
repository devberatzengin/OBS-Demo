package com.obs.backend.repository;

import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.EntityGraph;
import com.obs.backend.model.Enrollment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.obs.backend.model.enums.EnrollmentStatus;
import java.util.List;

@Repository
public interface EnrollmentRepository extends JpaRepository<Enrollment, Long> {
    List<Enrollment> findByStudentIdAndSemesterId(Long studentId, Long semesterId);
    List<Enrollment> findByStudentId(Long studentId);
    List<Enrollment> findByCourseId(Long courseId);
    java.util.Optional<Enrollment> findByCourseIdAndStudentId(Long courseId, Long studentId);
    java.util.Optional<Enrollment> findByCourseIdAndStudentIdAndSemesterId(Long courseId, Long studentId, Long semesterId);
    /** Course student lists and grade finalization read every student (plan 4.3: one query, not one per row). */
    @EntityGraph(attributePaths = {"student", "student.department"})
    List<Enrollment> findByCourseIdAndSemesterIdAndStatus(Long courseId, Long semesterId, EnrollmentStatus status);
    long countByCourseId(Long courseId);
    long countByCourseIdAndSemesterIdAndStatusNot(Long courseId, Long semesterId, EnrollmentStatus status);
    @EntityGraph(attributePaths = {"student", "course"})
    List<Enrollment> findByStudentAdvisorIdAndStatus(Long advisorId, EnrollmentStatus status);
    List<Enrollment> findByCourseIdAndStatus(Long courseId, EnrollmentStatus status);
    /** Transcript, GPA and registration history read the course and semester of every enrollment. */
    @EntityGraph(attributePaths = {"course", "semester"})
    List<Enrollment> findByStudentIdAndStatus(Long studentId, EnrollmentStatus status);

    /** Places taken per course in one semester (pending and approved): [courseId, count]. */
    @Query("""
            select e.course.id, count(e) from Enrollment e
            where e.course.id in :courseIds and e.semester.id = :semesterId and e.status <> :excluded
            group by e.course.id""")
    List<Object[]> countPerCourseExcludingStatus(@Param("courseIds") java.util.Collection<Long> courseIds,
                                                @Param("semesterId") Long semesterId,
                                                @Param("excluded") EnrollmentStatus excluded);

    /** Enrollments with one status per course in one semester: [courseId, count]. */
    @Query("""
            select e.course.id, count(e) from Enrollment e
            where e.course.id in :courseIds and e.semester.id = :semesterId and e.status = :status
            group by e.course.id""")
    List<Object[]> countPerCourseWithStatus(@Param("courseIds") java.util.Collection<Long> courseIds,
                                            @Param("semesterId") Long semesterId,
                                            @Param("status") EnrollmentStatus status);
    List<Enrollment> findByStudentIdAndSemesterIdAndStatus(Long studentId, Long semesterId, EnrollmentStatus status);
}
