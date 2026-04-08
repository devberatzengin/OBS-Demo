package com.obs.backend.model;

import com.obs.backend.model.enums.EnrollmentStatus;
import jakarta.persistence.*;
import lombok.*;
import lombok.NonNull;

@Entity
@Table(name = "enrollments")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Enrollment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    @NonNull
    private Student student;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_id", nullable = false)
    @NonNull
    private Course course;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "semester_id", nullable = false)
    @NonNull
    private Semester semester;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private EnrollmentStatus status = EnrollmentStatus.PENDING;

    @Builder.Default
    private String grade = "N/A"; // e.g., AA, BA, FF
    
    @Builder.Default
    private Double score = 0.0; // e.g., 85.5
}
