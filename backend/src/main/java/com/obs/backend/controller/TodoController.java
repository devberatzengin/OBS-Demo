package com.obs.backend.controller;

import jakarta.validation.Valid;

import com.obs.backend.dto.student.TodoDTO;
import com.obs.backend.service.TodoService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/todos")
@RequiredArgsConstructor
public class TodoController {

    private final TodoService todoService;

    @GetMapping
    public ResponseEntity<List<TodoDTO>> getTodos(Principal principal) {
        return ResponseEntity.ok(todoService.getTodos(principal.getName()));
    }

    @PostMapping
    public ResponseEntity<TodoDTO> addTodo(@Valid @RequestBody TodoDTO todoDTO, Principal principal) {
        return ResponseEntity.ok(todoService.addTodo(principal.getName(), todoDTO));
    }

    @PutMapping("/{id}")
    public ResponseEntity<TodoDTO> updateTodo(@PathVariable Long id, @Valid @RequestBody TodoDTO todoDTO, Principal principal) {
        return ResponseEntity.ok(todoService.updateTodo(principal.getName(), id, todoDTO));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTodo(@PathVariable Long id, Principal principal) {
        todoService.deleteTodo(principal.getName(), id);
        return ResponseEntity.ok().build();
    }

    @PatchMapping("/{id}/toggle")
    public ResponseEntity<Void> toggleTodo(@PathVariable Long id, Principal principal) {
        todoService.toggleTodo(principal.getName(), id);
        return ResponseEntity.ok().build();
    }
}
