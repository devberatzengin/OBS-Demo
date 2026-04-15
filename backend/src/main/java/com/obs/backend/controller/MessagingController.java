package com.obs.backend.controller;

import com.obs.backend.dto.student.ContactDTO;
import com.obs.backend.dto.student.MessageDTO;
import com.obs.backend.dto.student.MessageRequest;
import com.obs.backend.service.MessagingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/messaging")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class MessagingController {

    private final MessagingService messagingService;

    @PostMapping("/send")
    public ResponseEntity<MessageDTO> sendMessage(@RequestBody MessageRequest request, Principal principal) {
        return ResponseEntity.ok(messagingService.sendMessage(principal.getName(), request.getReceiverId(), request.getContent()));
    }

    @GetMapping("/history/{otherUserId}")
    public ResponseEntity<List<MessageDTO>> getChatHistory(@PathVariable Long otherUserId, Principal principal) {
        return ResponseEntity.ok(messagingService.getChatHistory(principal.getName(), otherUserId));
    }

    @GetMapping("/contacts")
    public ResponseEntity<List<ContactDTO>> getContacts(Principal principal) {
        return ResponseEntity.ok(messagingService.getContacts(principal.getName()));
    }

    @GetMapping("/unread")
    public ResponseEntity<List<MessageDTO>> getUnreadMessages(Principal principal) {
        return ResponseEntity.ok(messagingService.getUnreadMessages(principal.getName()));
    }
}
