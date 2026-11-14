package com.obs.backend.dto.academician;

import jakarta.validation.constraints.*;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdviseeMessageRequest {
    @NotBlank @Size(max = 1000)
    private String content;
}
