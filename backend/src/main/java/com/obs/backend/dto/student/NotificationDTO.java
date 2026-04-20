package com.obs.backend.dto.student;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificationDTO {
    private String title;
    private String message;
    private LocalDateTime timestamp;
    private boolean isRead;
}
