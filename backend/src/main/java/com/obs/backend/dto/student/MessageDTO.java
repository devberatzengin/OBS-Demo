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
public class MessageDTO {
    private Long id;
    private String content;
    private String senderName;
    private Long senderId;
    private LocalDateTime timestamp;
    private boolean isRead;
}
