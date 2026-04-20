package com.obs.backend.dto.student;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ContactDTO {
    private Long id;
    private String name;
    private String role; // e.g., 'Advisor', 'Instructor (Course Name)'
    private String lastMessage;
    private String lastMessageTime;
    private boolean online;
}
