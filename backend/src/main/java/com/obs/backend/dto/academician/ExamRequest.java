package com.obs.backend.dto.academician;

import com.obs.backend.model.enums.ExamType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExamRequest {
    private ExamType examType;
    private LocalDateTime examDate;
    private Double ratio;
    private Long classroomId;
}
