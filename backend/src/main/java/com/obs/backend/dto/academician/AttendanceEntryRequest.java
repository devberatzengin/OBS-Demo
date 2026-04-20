package com.obs.backend.dto.academician;

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
    private LocalDate attendanceDate;
    private List<StudentAttendanceDTO> attendance;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class StudentAttendanceDTO {
        private Long studentId;
        private boolean isPresent;
    }
}
