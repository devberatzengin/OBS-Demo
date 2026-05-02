package com.obs.backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "semesters")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Semester {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String name; // e.g., 2024-2025 Fall

    @Column
    private java.time.LocalDate startDate;

    @Column
    private java.time.LocalDate endDate;

    @Column
    private java.time.LocalDate examStartDate;

    @Column
    private java.time.LocalDate examEndDate;

    @Column
    private java.time.LocalDate makeupExamStartDate;

    @Column
    private java.time.LocalDate makeupExamEndDate;

    @Column
    private java.time.LocalDate registrationStartDate;

    @Column
    private java.time.LocalDate registrationEndDate;

    @Builder.Default
    @Column(nullable = false)
    private boolean isActive = false;
}
