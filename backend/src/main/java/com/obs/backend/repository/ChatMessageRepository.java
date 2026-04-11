package com.obs.backend.repository;

import com.obs.backend.model.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {
    @Query("SELECT m FROM ChatMessage m WHERE (m.sender.id = :uid1 AND m.receiver.id = :uid2) OR (m.sender.id = :uid2 AND m.receiver.id = :uid1) ORDER BY m.timestamp ASC")
    List<ChatMessage> findChatHistory(Long uid1, Long uid2);
    
    @Query("SELECT m FROM ChatMessage m WHERE m.sender.id = :userId OR m.receiver.id = :userId ORDER BY m.timestamp DESC")
    List<ChatMessage> findAllUserMessages(Long userId);

    List<ChatMessage> findByReceiverIdAndIsReadFalse(Long receiverId);
}
