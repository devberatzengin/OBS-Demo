package com.obs.backend.dto.user;

import jakarta.validation.constraints.*;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateProfileRequest {
    @Email @Size(max = 255)
    private String email;
    @Size(max = 30)
    private String phoneNumber;
    @Size(max = 255)
    private String address;
}
