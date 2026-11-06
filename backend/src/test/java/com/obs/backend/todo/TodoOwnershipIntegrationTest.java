package com.obs.backend.todo;

import com.obs.backend.model.Department;
import com.obs.backend.model.Student;
import com.obs.backend.model.TodoItem;
import com.obs.backend.repository.TodoItemRepository;
import com.obs.backend.support.AbstractIntegrationTest;
import com.obs.backend.support.AuthHelper;
import com.obs.backend.support.TestDataFactory;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.not;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Plan 1.2: a user can only read and change their own to-do items. */
@Transactional
class TodoOwnershipIntegrationTest extends AbstractIntegrationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private TestDataFactory data;
    @Autowired private AuthHelper auth;
    @Autowired private TodoItemRepository todoItemRepository;

    private Student alice;
    private Student bob;
    private TodoItem aliceTodo;

    @BeforeEach
    void setUp() {
        Department department = data.department();
        alice = data.student(department, null);
        bob = data.student(department, null);
        aliceTodo = data.todo(alice, "Alice's task");
    }

    @Test
    void anotherUserCannotUpdateTheItem() throws Exception {
        mockMvc.perform(put("/api/todos/" + aliceTodo.getId()).with(auth.as(bob))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"hacked\",\"completed\":true}"))
                .andExpect(status().isNotFound());

        TodoItem stored = todoItemRepository.findById(aliceTodo.getId()).orElseThrow();
        assertThat(stored.getTitle()).isEqualTo("Alice's task");
        assertThat(stored.isCompleted()).isFalse();
    }

    @Test
    void anotherUserCannotDeleteTheItem() throws Exception {
        mockMvc.perform(delete("/api/todos/" + aliceTodo.getId()).with(auth.as(bob)))
                .andExpect(status().isNotFound());

        assertThat(todoItemRepository.findById(aliceTodo.getId())).isPresent();
    }

    @Test
    void anotherUserCannotToggleTheItem() throws Exception {
        mockMvc.perform(patch("/api/todos/" + aliceTodo.getId() + "/toggle").with(auth.as(bob)))
                .andExpect(status().isNotFound());

        assertThat(todoItemRepository.findById(aliceTodo.getId()).orElseThrow().isCompleted()).isFalse();
    }

    @Test
    void anotherUserDoesNotSeeTheItemInTheirList() throws Exception {
        mockMvc.perform(get("/api/todos").with(auth.as(bob)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].title", not(hasItem("Alice's task"))));
    }

    @Test
    void ownerCanStillManageTheItem() throws Exception {
        mockMvc.perform(patch("/api/todos/" + aliceTodo.getId() + "/toggle").with(auth.as(alice)))
                .andExpect(status().isOk());
        assertThat(todoItemRepository.findById(aliceTodo.getId()).orElseThrow().isCompleted()).isTrue();

        mockMvc.perform(delete("/api/todos/" + aliceTodo.getId()).with(auth.as(alice)))
                .andExpect(status().isOk());
        assertThat(todoItemRepository.findById(aliceTodo.getId())).isEmpty();
    }

    @Test
    void requestsWithoutTokenAreRejected() throws Exception {
        mockMvc.perform(delete("/api/todos/" + aliceTodo.getId()))
                .andExpect(status().isForbidden());
    }
}
