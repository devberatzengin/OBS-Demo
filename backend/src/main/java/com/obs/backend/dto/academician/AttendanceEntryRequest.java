package com.obs.backend.dto.academician;

import jakarta.validation.Valid;

import jakarta.validation.constraints.*;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AttendanceEntryRequest {
    @NotNull
    private LocalDate attendanceDate;
    @NotEmpty @Valid
    private List<StudentAttendanceDTO> attendance;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class StudentAttendanceDTO {
        @NotNull
        private Long studentId;
        private boolean isPresent;
    }
}
