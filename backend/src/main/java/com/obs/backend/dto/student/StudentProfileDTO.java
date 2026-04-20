package com.obs.backend.dto.student;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StudentProfileDTO {
    private String fullName;
    private String studentNumber;
    private String email;
    private String phoneNumber;
    private String address;
    private String facultyName;
    private String departmentName;
    private String advisorName;
    private LocalDate registrationDate;
    private Integer currentSemester;
}
