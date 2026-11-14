package com.obs.backend.dto.student;

import jakarta.validation.constraints.*;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MessageRequest {
    @NotNull
    private Long receiverId;
    @NotBlank @Size(max = 1000)
    private String content;
}
