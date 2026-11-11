package com.obs.backend.dto.admin;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminAcademicianRegisterRequest {
    private Long id;
    private String username;
    private String password;
    private String email;
    private String firstName;
    private String lastName;
    private String staffNumber;
    private String academicTitle;
    private Long departmentId;
    private String officeNumber;

    /** Read-only in responses: whether the account can sign in. Ignored on create/update. */
    private Boolean active;
}
