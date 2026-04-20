package com.obs.backend.dto.admin;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ClassroomDTO {
    private Long id;
    private String code;
    private Integer capacity;
}
