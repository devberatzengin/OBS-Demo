package com.obs.backend.dto.admin;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminProfileDTO {
    private Long id;
    private String fullName;
    private String email;
    private String phoneNumber;
    private String address;
    private String staffNumber;
    private String position;
    private String facultyName;
    private String departmentName;
}
