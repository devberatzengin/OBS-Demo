package com.obs.backend.dto.chat;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatMessageDTO {
    private Long id;
    private String content;
    private LocalDateTime timestamp;
    private Long senderId;
    private Long receiverId;
    private boolean isRead;
}
