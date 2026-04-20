package com.obs.backend.dto.academician;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PendingEnrollmentDTO {
    private Long id;
    private String studentName;
    private String courseName;
    private String courseCode;
}
