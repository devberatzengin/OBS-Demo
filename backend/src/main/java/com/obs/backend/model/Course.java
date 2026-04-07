package com.obs.backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.NonNull;

@Entity
@Table(name = "courses")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Course {
    private Integer semesterLevel; // 1: freshman, 2: sophomore, etc.

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    @NonNull
    private String code; // e.g., CSE101

    @Column(nullable = false)
    @NonNull
    private String name;

    @Column(nullable = false)
    @Builder.Default
    private Integer akts = 0;

    @Column(nullable = false)
    @Builder.Default
    private Integer credits = 0;

    @Builder.Default
    private String language = "Turkish";

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id", nullable = false)
    private Department department;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "instructor_id")
    private Academician instructor;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(columnDefinition = "TEXT")
    private String syllabus;

    @Builder.Default
    private boolean open = false;

    @Builder.Default
    private Integer quota = 0;
}
