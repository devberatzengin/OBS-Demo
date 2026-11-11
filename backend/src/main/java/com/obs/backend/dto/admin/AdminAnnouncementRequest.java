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
public class AdminAnnouncementRequest {
    @NotBlank @Size(max = 255)
    private String title;
    @NotBlank @Size(max = 2000)
    private String content;
    private String targetRole; // STUDENT, ACADEMICIAN or ALL
}
