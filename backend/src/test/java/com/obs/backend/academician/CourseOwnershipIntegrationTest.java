package com.obs.backend.academician;

import com.obs.backend.model.Academician;
import com.obs.backend.model.Course;
import com.obs.backend.model.Department;
import com.obs.backend.support.AbstractIntegrationTest;
import com.obs.backend.support.AuthHelper;
import com.obs.backend.support.TestDataFactory;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Plan 1.5: course read endpoints that had no instructor check. */
@Transactional
class CourseOwnershipIntegrationTest extends AbstractIntegrationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private TestDataFactory data;
    @Autowired private AuthHelper auth;

    private Academician instructor;
    private Academician otherAcademician;
    private Course course;

    @BeforeEach
    void setUp() {
        Department department = data.department();
        instructor = data.academician(department);
        otherAcademician = data.academician(department);
        course = data.course(department, instructor);
    }

    @ParameterizedTest
    @ValueSource(strings = {"attendance/today", "schedule", "announcements"})
    void anotherAcademicianIsForbidden(String path) throws Exception {
        mockMvc.perform(get("/api/academician/courses/" + course.getId() + "/" + path).with(auth.as(otherAcademician)))
                .andExpect(status().isForbidden());
    }

    @ParameterizedTest
    @ValueSource(strings = {"attendance/today", "schedule", "announcements"})
    void theInstructorCanRead(String path) throws Exception {
        mockMvc.perform(get("/api/academician/courses/" + course.getId() + "/" + path).with(auth.as(instructor)))
                .andExpect(status().isOk());
    }
}
