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
public class AcademicianExamDTO {
    private Long id;
    private ExamType examType;
    private LocalDateTime examDate;
    private Double ratio;
    private ClassroomDTO classroom;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ClassroomDTO {
        private Long id;
        private String code;
    }
}
