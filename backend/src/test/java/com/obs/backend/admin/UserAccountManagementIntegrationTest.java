package com.obs.backend.admin;

import com.obs.backend.model.Administrative;
import com.obs.backend.model.Student;
import com.obs.backend.model.enums.Role;
import com.obs.backend.repository.UserRepository;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Plan 1.3 (K3: staff manage students and academicians only; K4: deactivate instead of delete). */
@Transactional
class UserAccountManagementIntegrationTest extends AbstractIntegrationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private TestDataFactory data;
    @Autowired private AuthHelper auth;
    @Autowired private UserRepository userRepository;

    private Administrative admin;
    private Administrative staff;
    private Student student;

    @BeforeEach
    void setUp() {
        admin = data.staff(Role.ADMIN);
        staff = data.staff(Role.ADMINISTRATIVE);
        student = data.student(data.department(), null);
    }

    private boolean isActive(Long userId) {
        return userRepository.findById(userId).orElseThrow().isActive();
    }

    // --- staff permissions (K3) ---

    @Test
    void staffCanListStudents() throws Exception {
        mockMvc.perform(get("/api/admin/users/students").with(auth.as(staff)))
                .andExpect(status().isOk());
    }

    @Test
    void staffCannotCreateStaffOrAdminAccounts() throws Exception {
        mockMvc.perform(post("/api/admin/users/administrative").with(auth.as(staff))
                        .contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isForbidden());
    }

    @Test
    void staffCannotEditTheAdminAccount() throws Exception {
        mockMvc.perform(put("/api/admin/users/administrative/" + admin.getId()).with(auth.as(staff))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"firstName\":\"Hijacked\",\"password\":\"newpass123\"}"))
                .andExpect(status().isForbidden());

        assertThat(userRepository.findById(admin.getId()).orElseThrow().getFirstName()).isEqualTo("Staff");
    }

    @Test
    void staffCannotDeactivateUsers() throws Exception {
        mockMvc.perform(delete("/api/admin/users/" + student.getId()).with(auth.as(staff)))
                .andExpect(status().isForbidden());

        assertThat(isActive(student.getId())).isTrue();
    }

    // --- deactivation (K4) ---

    @Test
    void deleteDeactivatesTheAccountInsteadOfRemovingIt() throws Exception {
        mockMvc.perform(delete("/api/admin/users/" + student.getId()).with(auth.as(admin)))
                .andExpect(status().isOk());

        assertThat(userRepository.findById(student.getId())).isPresent();
        assertThat(isActive(student.getId())).isFalse();
    }

    @Test
    void adminCannotDeactivateThemselves() throws Exception {
        mockMvc.perform(delete("/api/admin/users/" + admin.getId()).with(auth.as(admin)))
                .andExpect(status().isBadRequest());

        assertThat(isActive(admin.getId())).isTrue();
    }

    @Test
    void adminAccountsCannotBeDeactivated() throws Exception {
        Administrative otherAdmin = data.staff(Role.ADMIN);

        mockMvc.perform(delete("/api/admin/users/" + otherAdmin.getId()).with(auth.as(admin)))
                .andExpect(status().isBadRequest());

        assertThat(isActive(otherAdmin.getId())).isTrue();
    }

    @Test
    void adminCanReactivateAnAccount() throws Exception {
        mockMvc.perform(delete("/api/admin/users/" + student.getId()).with(auth.as(admin)))
                .andExpect(status().isOk());
        mockMvc.perform(patch("/api/admin/users/" + student.getId() + "/reactivate").with(auth.as(admin)))
                .andExpect(status().isOk());

        assertThat(isActive(student.getId())).isTrue();
    }

    @Test
    void userListsExposeTheActiveFlag() throws Exception {
        mockMvc.perform(delete("/api/admin/users/" + student.getId()).with(auth.as(admin)))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/admin/users/students").with(auth.as(admin)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.id == " + student.getId() + ")].active").value(false));
    }
}
