package com.obs.backend.model;

import jakarta.persistence.Column;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.NonNull;
import lombok.experimental.SuperBuilder;

import java.time.LocalDate;

@Entity
@Table(name = "students")
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class Student extends User {

    @Column(unique = true, nullable = false)
    @NonNull
    private String studentNumber;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id")
    private Department department;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "advisor_id")
    private Academician advisor;

    @Builder.Default
    private Integer currentSemester = 1;
    
    @Builder.Default
    private Double gpa = 0.0;
    
    private LocalDate registrationDate;

    // Özlük Bilgileri (Opsiyonel)
    private String motherName;
    private String fatherName;
    private LocalDate birthDate;
    private String birthPlace;
    // TODO: Advisor will be added later
}
