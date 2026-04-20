package com.obs.backend.dto.academician;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalTime;
import java.time.DayOfWeek;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OfficeHourRequest {
    private DayOfWeek dayOfWeek;
    private LocalTime startTime;
    private LocalTime endTime;
}
