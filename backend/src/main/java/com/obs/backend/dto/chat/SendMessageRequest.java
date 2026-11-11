package com.obs.backend.dto.chat;

import jakarta.validation.constraints.*;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SendMessageRequest {
    @NotNull
    private Long receiverId;
    @NotBlank @Size(max = 1000)
    private String content;
}
