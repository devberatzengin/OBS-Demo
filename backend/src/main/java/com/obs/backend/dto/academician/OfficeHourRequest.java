package com.obs.backend.dto.academician;

import jakarta.validation.constraints.*;

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
    @NotNull
    private DayOfWeek dayOfWeek;
    @NotNull
    private LocalTime startTime;
    @NotNull
    private LocalTime endTime;
}
