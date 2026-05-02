package com.obs.backend.service;

import com.obs.backend.dto.chat.*;
import java.util.List;

public interface ChatService {
    List<ChatSummaryDTO> getConversations();
    List<ChatMessageDTO> getMessages(Long otherUserId);
    void sendMessage(SendMessageRequest request);
    List<UserSearchDTO> searchUsers(String query);
}
