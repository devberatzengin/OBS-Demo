package com.obs.backend;

import com.obs.backend.repository.*;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class DiagnosticTask implements CommandLineRunner {
    private final StudentRepository studentRepository;
    private final AcademicianRepository academicianRepository;
    private final DepartmentRepository departmentRepository;
    private final CourseRepository courseRepository;
    private final FacultyRepository facultyRepository;

    public DiagnosticTask(StudentRepository studentRepository, 
                          AcademicianRepository academicianRepository,
                          DepartmentRepository departmentRepository,
                          CourseRepository courseRepository,
                          FacultyRepository facultyRepository) {
        this.studentRepository = studentRepository;
        this.academicianRepository = academicianRepository;
        this.departmentRepository = departmentRepository;
        this.courseRepository = courseRepository;
        this.facultyRepository = facultyRepository;
    }

    @Override
    public void run(String... args) throws Exception {
        System.out.println("=== DIAGNOSTIC START ===");
        System.out.println("Global Student Count: " + studentRepository.count());
        System.out.println("Global Academician Count: " + academicianRepository.count());
        System.out.println("Global Department Count: " + departmentRepository.count());
        System.out.println("Global Faculty Count: " + facultyRepository.count());
        
        long deptId = 1L;
        System.out.println("Dept 1 Student Count: " + studentRepository.countByDepartmentId(deptId));
        System.out.println("Dept 1 Academician Count: " + academicianRepository.countByDepartmentId(deptId));
        
        long facultyId = 1L;
        System.out.println("Faculty 1 Student Count: " + studentRepository.countByDepartmentFacultyId(facultyId));
        System.out.println("=== DIAGNOSTIC END ===");
    }
}
