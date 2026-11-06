package com.obs.backend.service;

import com.obs.backend.dto.student.TodoDTO;

import java.util.List;

public interface TodoService {
    List<TodoDTO> getTodos(String username);
    TodoDTO addTodo(String username, TodoDTO todoDTO);
    TodoDTO updateTodo(String username, Long id, TodoDTO todoDTO);
    void deleteTodo(String username, Long id);
    void toggleTodo(String username, Long id);
}
