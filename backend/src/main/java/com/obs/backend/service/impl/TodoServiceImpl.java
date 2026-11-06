package com.obs.backend.service.impl;

import com.obs.backend.dto.student.TodoDTO;
import com.obs.backend.exception.ErrorCode;
import com.obs.backend.exception.ObsException;
import com.obs.backend.model.*;
import com.obs.backend.repository.TodoItemRepository;
import com.obs.backend.repository.UserRepository;
import com.obs.backend.service.TodoService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class TodoServiceImpl implements TodoService {

    private final TodoItemRepository todoItemRepository;
    private final UserRepository userRepository;

    @Override
    public List<TodoDTO> getTodos(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ObsException(ErrorCode.RESOURCE_NOT_FOUND, "User not found"));

        return todoItemRepository.findByUserOrderByDueDateAsc(user)
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Override
    public TodoDTO addTodo(String username, TodoDTO todoDTO) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ObsException(ErrorCode.RESOURCE_NOT_FOUND, "User not found"));

        TodoItem item = TodoItem.builder()
                .title(todoDTO.getTitle())
                .description(todoDTO.getDescription())
                .dueDate(todoDTO.getDueDate() != null ? java.time.LocalDateTime.parse(todoDTO.getDueDate()) : null)
                .priority(todoDTO.getPriority() != null ? TodoPriority.valueOf(todoDTO.getPriority())
                        : TodoPriority.MEDIUM)
                .category(todoDTO.getCategory() != null ? TodoCategory.valueOf(todoDTO.getCategory())
                        : TodoCategory.ACADEMIC)
                .user(user)
                .completed(false)
                .build();
        TodoItem savedItem = todoItemRepository.saveAndFlush(item);
        return mapToDTO(savedItem);
    }

    @Override
    public TodoDTO updateTodo(String username, Long id, TodoDTO todoDTO) {
        TodoItem item = findOwnedItem(username, id);

        item.setTitle(todoDTO.getTitle());
        item.setDescription(todoDTO.getDescription());
        item.setDueDate(todoDTO.getDueDate() != null ? java.time.LocalDateTime.parse(todoDTO.getDueDate()) : null);
        item.setCompleted(todoDTO.isCompleted());
        if (todoDTO.getPriority() != null)
            item.setPriority(TodoPriority.valueOf(todoDTO.getPriority()));
        if (todoDTO.getCategory() != null)
            item.setCategory(TodoCategory.valueOf(todoDTO.getCategory()));

        TodoItem savedItem = todoItemRepository.saveAndFlush(item);
        return mapToDTO(savedItem);
    }

    @Override
    public void deleteTodo(String username, Long id) {
        todoItemRepository.delete(findOwnedItem(username, id));
    }

    @Override
    public void toggleTodo(String username, Long id) {
        TodoItem item = findOwnedItem(username, id);
        item.setCompleted(!item.isCompleted());
        todoItemRepository.saveAndFlush(item);
    }

    /**
     * Loads an item only if it belongs to the caller. Someone else's item is reported as
     * not found, so ids cannot be probed for existence.
     */
    private TodoItem findOwnedItem(String username, Long id) {
        return todoItemRepository.findByIdAndUserUsername(id, username)
                .orElseThrow(() -> new ObsException(ErrorCode.RESOURCE_NOT_FOUND, "Todo item not found"));
    }

    private TodoDTO mapToDTO(TodoItem item) {
        return TodoDTO.builder()
                .id(item.getId())
                .title(item.getTitle())
                .description(item.getDescription())
                .completed(item.isCompleted())
                .dueDate(item.getDueDate() != null ? item.getDueDate().toString() : null)
                .priority(item.getPriority() != null ? item.getPriority().name() : TodoPriority.MEDIUM.name())
                .category(item.getCategory() != null ? item.getCategory().name() : TodoCategory.ACADEMIC.name())
                .build();
    }
}
