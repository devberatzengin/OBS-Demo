package com.obs.backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "todo_items")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TodoItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    private String description;

    @Builder.Default
    private boolean completed = false;

    private LocalDateTime dueDate;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private TodoPriority priority = TodoPriority.MEDIUM;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private TodoCategory category = TodoCategory.ACADEMIC;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
}
