package com.obs.backend.dto.academician;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AcademicianProfileDTO {
    private Long id;
    private String firstName;
    private String lastName;
    private String fullName;
    private String email;
    private String phoneNumber;
    private String address;
    private String departmentName;
    private String title;
    private String office;
}
