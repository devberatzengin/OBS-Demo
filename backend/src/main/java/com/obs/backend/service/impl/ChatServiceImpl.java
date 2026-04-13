package com.obs.backend.service.impl;

import com.obs.backend.dto.chat.*;
import com.obs.backend.exception.ErrorCode;
import com.obs.backend.exception.ObsException;
import com.obs.backend.model.ChatMessage;
import com.obs.backend.model.User;
import com.obs.backend.repository.ChatMessageRepository;
import com.obs.backend.repository.UserRepository;
import com.obs.backend.service.ChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ChatServiceImpl implements ChatService {
    private final ChatMessageRepository chatMessageRepository;
    private final UserRepository userRepository;

    @Override
    public List<ChatSummaryDTO> getConversations() {
        User currentUser = getCurrentUser();
        List<ChatMessage> allMessages = chatMessageRepository.findAllUserMessages(currentUser.getId());
        
        Map<Long, ChatSummaryDTO> summaries = new LinkedHashMap<>();
        
        for (ChatMessage m : allMessages) {
            User otherUser = m.getSender().getId().equals(currentUser.getId()) ? m.getReceiver() : m.getSender();
            if (!summaries.containsKey(otherUser.getId())) {
                summaries.put(otherUser.getId(), ChatSummaryDTO.builder()
                        .userId(otherUser.getId())
                        .fullName(otherUser.getFirstName() + " " + otherUser.getLastName())
                        .lastMessage(m.getContent())
                        .lastMessageTimestamp(m.getTimestamp())
                        .unreadCount(0) // Will calculate below
                        .role(otherUser.getRole().name())
                        .build());
            }
        }
        
        // Calculate unread counts
        List<ChatMessage> unreadMessages = chatMessageRepository.findByReceiverIdAndIsReadFalse(currentUser.getId());
        for (ChatMessage m : unreadMessages) {
            ChatSummaryDTO summary = summaries.get(m.getSender().getId());
            if (summary != null) {
                summary.setUnreadCount(summary.getUnreadCount() + 1);
            }
        }

        return new ArrayList<>(summaries.values());
    }

    @Override
    @Transactional
    public List<ChatMessageDTO> getMessages(Long otherUserId) {
        User currentUser = getCurrentUser();
        List<ChatMessage> history = chatMessageRepository.findChatHistory(currentUser.getId(), otherUserId);
        
        // Mark as read
        history.stream()
                .filter(m -> m.getReceiver().getId().equals(currentUser.getId()) && !m.isRead())
                .forEach(m -> m.setRead(true));
        
        return history.stream().map(m -> ChatMessageDTO.builder()
                .id(m.getId())
                .content(m.getContent())
                .timestamp(m.getTimestamp())
                .senderId(m.getSender().getId())
                .receiverId(m.getReceiver().getId())
                .isRead(m.isRead())
                .build()).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void sendMessage(SendMessageRequest request) {
        User currentUser = getCurrentUser();
        User receiver = userRepository.findById(request.getReceiverId())
                .orElseThrow(() -> new ObsException(ErrorCode.RESOURCE_NOT_FOUND, "Receiver not found"));

        ChatMessage message = ChatMessage.builder()
                .content(request.getContent())
                .timestamp(LocalDateTime.now())
                .sender(currentUser)
                .receiver(receiver)
                .isRead(false)
                .build();
        
        chatMessageRepository.save(message);
    }

    @Override
    public List<UserSearchDTO> searchUsers(String query) {
        if (query == null || query.trim().length() < 2) return Collections.emptyList();
        
        return userRepository.findByFirstNameContainingIgnoreCaseOrLastNameContainingIgnoreCase(query, query)
                .stream()
                .map(u -> UserSearchDTO.builder()
                        .id(u.getId())
                        .fullName(u.getFirstName() + " " + u.getLastName())
                        .role(u.getRole().name())
                        .build())
                .limit(10)
                .collect(Collectors.toList());
    }

    private User getCurrentUser() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new ObsException(ErrorCode.RESOURCE_NOT_FOUND, "User not found"));
    }
}
