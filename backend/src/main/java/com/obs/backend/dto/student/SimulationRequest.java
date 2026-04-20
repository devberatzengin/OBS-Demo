package com.obs.backend.dto.student;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SimulationRequest {
    // Map of courseCode to hypothetical letter grade
    private Map<String, String> hypotheticalGrades;
}
