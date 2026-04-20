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
public class ChatSummaryDTO {
    private Long userId;
    private String fullName;
    private String lastMessage;
    private LocalDateTime lastMessageTimestamp;
    private int unreadCount;
    private String role;
}
