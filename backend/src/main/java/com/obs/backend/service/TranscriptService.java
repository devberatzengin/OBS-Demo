package com.obs.backend.service;

import com.obs.backend.dto.student.SimulationRequest;
import com.obs.backend.dto.student.TranscriptDTO;

public interface TranscriptService {
    TranscriptDTO getTranscript(String username);
    Double simulateGpa(String username, SimulationRequest request);
}
