package com.obs.backend.service;

import com.obs.backend.dto.student.TodoDTO;

import java.util.List;

public interface TodoService {
    List<TodoDTO> getTodos(String username);
    TodoDTO addTodo(String username, TodoDTO todoDTO);
    TodoDTO updateTodo(Long id, TodoDTO todoDTO);
    void deleteTodo(Long id);
    void toggleTodo(Long id);
}
