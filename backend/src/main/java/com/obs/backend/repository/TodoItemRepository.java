package com.obs.backend.repository;

import com.obs.backend.model.TodoItem;
import com.obs.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TodoItemRepository extends JpaRepository<TodoItem, Long> {
    List<TodoItem> findByUserOrderByDueDateAsc(User user);
}
