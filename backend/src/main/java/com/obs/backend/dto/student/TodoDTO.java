package com.obs.backend.dto.student;

import jakarta.validation.constraints.*;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TodoDTO {
    private Long id;
    @NotBlank @Size(max = 255)
    private String title;
    @Size(max = 255)
    private String description;
    private boolean completed;
    private String dueDate;
    private String priority;
    private String category;
}
