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
    public TodoDTO updateTodo(Long id, TodoDTO todoDTO) {
        TodoItem item = todoItemRepository.findById(id)
                .orElseThrow(() -> new ObsException(ErrorCode.RESOURCE_NOT_FOUND, "Todo item not found"));

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
    public void deleteTodo(Long id) {
        todoItemRepository.deleteById(id);
    }

    @Override
    public void toggleTodo(Long id) {
        TodoItem item = todoItemRepository.findById(id)
                .orElseThrow(() -> new ObsException(ErrorCode.RESOURCE_NOT_FOUND, "Todo item not found"));
        item.setCompleted(!item.isCompleted());
        todoItemRepository.saveAndFlush(item);
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
