package com.obs.backend.dto.admin;

import jakarta.validation.constraints.*;

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
    @NotBlank @Size(min = 3, max = 50)
    private String username;
    @Pattern(regexp = "^$|^.{8,72}$", message = "must be 8 to 72 characters")
    private String password;
    @NotBlank @Email @Size(max = 255)
    private String email;
    @NotBlank @Size(max = 100)
    private String firstName;
    @NotBlank @Size(max = 100)
    private String lastName;
    @NotBlank @Size(max = 50)
    private String staffNumber;
    private String position;

    /** Read-only in responses: whether the account can sign in. Ignored on create/update. */
    private Boolean active;

    /** Read-only in responses: ADMIN or ADMINISTRATIVE. */
    private String role;
}
