package com.obs.backend.support;

import com.obs.backend.model.*;
import com.obs.backend.model.enums.EnrollmentStatus;
import com.obs.backend.model.enums.Role;
import com.obs.backend.repository.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.concurrent.atomic.AtomicLong;

/**
 * Builds and saves test entities with unique names, so a test only states what matters to it.
 * Every user gets the password {@link #PASSWORD}.
 */
@Component
public class TestDataFactory {

    public static final String PASSWORD = "password123";
    private static final AtomicLong SEQ = new AtomicLong(System.currentTimeMillis());

    private final FacultyRepository facultyRepository;
    private final DepartmentRepository departmentRepository;
    private final SemesterRepository semesterRepository;
    private final ClassroomRepository classroomRepository;
    private final AcademicianRepository academicianRepository;
    private final StudentRepository studentRepository;
    private final AdministrativeRepository administrativeRepository;
    private final CourseRepository courseRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final TodoItemRepository todoItemRepository;
    private final PasswordEncoder passwordEncoder;

    public TestDataFactory(FacultyRepository facultyRepository, DepartmentRepository departmentRepository,
                           SemesterRepository semesterRepository, ClassroomRepository classroomRepository,
                           AcademicianRepository academicianRepository, StudentRepository studentRepository,
                           AdministrativeRepository administrativeRepository, CourseRepository courseRepository,
                           EnrollmentRepository enrollmentRepository, TodoItemRepository todoItemRepository,
                           PasswordEncoder passwordEncoder) {
        this.facultyRepository = facultyRepository;
        this.departmentRepository = departmentRepository;
        this.semesterRepository = semesterRepository;
        this.classroomRepository = classroomRepository;
        this.academicianRepository = academicianRepository;
        this.studentRepository = studentRepository;
        this.administrativeRepository = administrativeRepository;
        this.courseRepository = courseRepository;
        this.enrollmentRepository = enrollmentRepository;
        this.todoItemRepository = todoItemRepository;
        this.passwordEncoder = passwordEncoder;
    }

    private static long next() {
        return SEQ.incrementAndGet();
    }

    public Faculty faculty() {
        return facultyRepository.save(Faculty.builder().name("Faculty " + next()).build());
    }

    /** A department in a new faculty. */
    public Department department() {
        return departmentRepository.save(Department.builder().name("Department " + next()).faculty(faculty()).build());
    }

    public Semester semester(boolean active) {
        return semesterRepository.save(Semester.builder().name("Semester " + next()).isActive(active).build());
    }

    public Classroom classroom() {
        return classroomRepository.save(Classroom.builder().code("ROOM-" + next()).capacity(50).build());
    }

    public Academician academician(Department department) {
        long n = next();
        return academicianRepository.save(Academician.builder()
                .username("acad" + n)
                .password(passwordEncoder.encode(PASSWORD))
                .email("acad" + n + "@test.edu")
                .firstName("Acad")
                .lastName("Test" + n)
                .role(Role.ACADEMICIAN)
                .isActive(true)
                .staffNumber("ST" + n)
                .department(department)
                .build());
    }

    public Student student(Department department, Academician advisor) {
        long n = next();
        return studentRepository.save(Student.builder()
                .username("stu" + n)
                .password(passwordEncoder.encode(PASSWORD))
                .email("stu" + n + "@test.edu")
                .firstName("Stu")
                .lastName("Test" + n)
                .role(Role.STUDENT)
                .isActive(true)
                .studentNumber("S" + n)
                .department(department)
                .advisor(advisor)
                .currentSemester(1)
                .build());
    }

    public Administrative staff(Role role) {
        long n = next();
        return administrativeRepository.save(Administrative.builder()
                .username("staff" + n)
                .password(passwordEncoder.encode(PASSWORD))
                .email("staff" + n + "@test.edu")
                .firstName("Staff")
                .lastName("Test" + n)
                .role(role)
                .isActive(true)
                .staffNumber("AD" + n)
                .position(role == Role.ADMIN ? "Root Admin" : "Registrar")
                .build());
    }

    public Course course(Department department, Academician instructor) {
        long n = next();
        return courseRepository.save(Course.builder()
                .code("C" + n)
                .name("Course " + n)
                .akts(5)
                .credits(3)
                .department(department)
                .instructor(instructor)
                .build());
    }

    public Enrollment enrollment(Student student, Course course, Semester semester, EnrollmentStatus status) {
        return enrollmentRepository.save(Enrollment.builder()
                .student(student)
                .course(course)
                .semester(semester)
                .status(status)
                .build());
    }

    public TodoItem todo(User owner, String title) {
        return todoItemRepository.save(TodoItem.builder().title(title).user(owner).build());
    }
}
