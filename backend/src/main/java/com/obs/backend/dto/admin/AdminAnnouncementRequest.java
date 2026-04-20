package com.obs.backend.dto.admin;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminAnnouncementRequest {
    private String title;
    private String content;
    private String targetRole; // STUDENT, ACADEMICIAN or ALL
}
