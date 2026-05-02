package com.obs.backend.service;

import com.obs.backend.dto.student.ContactDTO;
import com.obs.backend.dto.student.MessageDTO;

import java.util.List;

public interface MessagingService {
    MessageDTO sendMessage(String senderUsername, Long receiverId, String content);
    List<MessageDTO> getChatHistory(String username, Long otherUserId);
    List<MessageDTO> getUnreadMessages(String username);
    List<ContactDTO> getContacts(String username);
    void markAsRead(Long messageId);
}
