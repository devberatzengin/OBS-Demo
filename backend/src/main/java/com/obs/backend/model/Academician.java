package com.obs.backend.model;

import jakarta.persistence.Column;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

@Entity
@Table(name = "academicians")
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class Academician extends User {

    @Column(unique = true, nullable = false)
    private String staffNumber;

    private String academicTitle; // e.g., Prof. Dr., Asst. Prof.

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id")
    private Department department;

    private String officeNumber;

    // Özlük Bilgileri
    private java.time.LocalDate birthDate;
}
