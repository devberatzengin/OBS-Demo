package com.obs.backend.messaging;

import com.obs.backend.exception.ObsException;
import com.obs.backend.model.ChatMessage;
import com.obs.backend.model.Department;
import com.obs.backend.model.Student;
import com.obs.backend.repository.ChatMessageRepository;
import com.obs.backend.service.MessagingService;
import com.obs.backend.support.AbstractIntegrationTest;
import com.obs.backend.support.TestDataFactory;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/** Plan 1.5: only the receiver can mark a message as read. */
@Transactional
class MarkAsReadOwnershipTest extends AbstractIntegrationTest {

    @Autowired private TestDataFactory data;
    @Autowired private MessagingService messagingService;
    @Autowired private ChatMessageRepository chatMessageRepository;

    private Student sender;
    private Student receiver;
    private ChatMessage message;

    @BeforeEach
    void setUp() {
        Department department = data.department();
        sender = data.student(department, null);
        receiver = data.student(department, null);
        message = chatMessageRepository.save(ChatMessage.builder()
                .content("hello")
                .timestamp(LocalDateTime.now())
                .sender(sender)
                .receiver(receiver)
                .isRead(false)
                .build());
    }

    @Test
    void someoneElseCannotMarkTheMessageRead() {
        assertThatThrownBy(() -> messagingService.markAsRead(sender.getUsername(), message.getId()))
                .isInstanceOf(ObsException.class);

        assertThat(chatMessageRepository.findById(message.getId()).orElseThrow().isRead()).isFalse();
    }

    @Test
    void theReceiverCanMarkTheMessageRead() {
        messagingService.markAsRead(receiver.getUsername(), message.getId());

        assertThat(chatMessageRepository.findById(message.getId()).orElseThrow().isRead()).isTrue();
    }
}
