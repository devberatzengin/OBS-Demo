package com.obs.backend.dto.student;

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
public class ExamDTO {
    private String courseCode;
    private String courseName;
    private ExamType examType;
    private LocalDateTime examDate;
    private String classroomCode;
    private Double ratio;
    private String status; // Dynamic: UPCOMING, ATTENDED, MISSED
}
