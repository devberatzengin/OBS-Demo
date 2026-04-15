package com.obs.backend.controller;

import com.obs.backend.dto.chat.*;
import com.obs.backend.service.ChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
public class ChatController {
    private final ChatService chatService;

    @GetMapping("/conversations")
    public ResponseEntity<List<ChatSummaryDTO>> getConversations() {
        return ResponseEntity.ok(chatService.getConversations());
    }

    @GetMapping("/messages/{userId}")
    public ResponseEntity<List<ChatMessageDTO>> getMessages(@PathVariable Long userId) {
        return ResponseEntity.ok(chatService.getMessages(userId));
    }

    @PostMapping("/send")
    public ResponseEntity<Void> sendMessage(@RequestBody SendMessageRequest request) {
        chatService.sendMessage(request);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/search")
    public ResponseEntity<List<UserSearchDTO>> searchUsers(@RequestParam String query) {
        return ResponseEntity.ok(chatService.searchUsers(query));
    }
}
