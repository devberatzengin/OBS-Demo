package com.obs.backend.dto.admin;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminStudentRegisterRequest {
    private Long id;
    private String username;
    private String password;
    private String email;
    private String firstName;
    private String lastName;
    private String studentNumber;
    private Long departmentId;
    private Long advisorId;
}
