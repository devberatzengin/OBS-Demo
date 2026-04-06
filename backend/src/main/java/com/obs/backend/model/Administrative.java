package com.obs.backend.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

@Entity
@Table(name = "administratives")
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class Administrative extends User {

    @Column(unique = true, nullable = false)
    private String staffNumber;

    private String position; // e.g., Registrar, Secretary

    @jakarta.persistence.ManyToOne
    @jakarta.persistence.JoinColumn(name = "faculty_id")
    private Faculty faculty;

    @jakarta.persistence.ManyToOne
    @jakarta.persistence.JoinColumn(name = "department_id")
    private Department department;
}
