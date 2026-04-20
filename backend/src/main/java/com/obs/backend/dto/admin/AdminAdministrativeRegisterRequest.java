package com.obs.backend.dto.admin;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminAdministrativeRegisterRequest {
    private Long id;
    private String username;
    private String password;
    private String email;
    private String firstName;
    private String lastName;
    private String staffNumber;
    private String position;
}
