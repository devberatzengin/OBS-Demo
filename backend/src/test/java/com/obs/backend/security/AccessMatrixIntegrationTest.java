package com.obs.backend.security;

import com.obs.backend.model.*;
import com.obs.backend.model.enums.Role;
import com.obs.backend.support.AbstractIntegrationTest;
import com.obs.backend.support.AuthHelper;
import com.obs.backend.support.TestDataFactory;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.method.HandlerMethod;
import org.springframework.web.servlet.mvc.method.RequestMappingInfo;
import org.springframework.web.servlet.mvc.method.annotation.RequestMappingHandlerMapping;

import java.util.*;
import java.util.stream.Stream;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.request;

/**
 * Plan 4.1: every endpoint x every kind of caller. A caller without the role is stopped by the
 * security filter (401 anonymous, 403 otherwise, empty body); a caller with the role gets past it
 * (whatever the service answers next: 200, 400, 404, or a service-level 403 with an error body).
 * A new endpoint fails {@link #everyEndpointIsInTheMatrix()} until it is added to {@link #ENDPOINTS}.
 */
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
@Transactional
class AccessMatrixIntegrationTest extends AbstractIntegrationTest {

    enum Caller { ANONYMOUS, STUDENT, ACADEMICIAN, STAFF, ADMIN }

    private static final Set<Caller> AUTHENTICATED =
            EnumSet.of(Caller.STUDENT, Caller.ACADEMICIAN, Caller.STAFF, Caller.ADMIN);

    /** Staff may manage students and academicians, but not staff or admin accounts (decision K3). */
    private static final Set<String> ADMIN_ONLY = Set.of(
            "POST /api/admin/users/administrative",
            "PUT /api/admin/users/administrative/{id}",
            "DELETE /api/admin/users/{id}",
            "PATCH /api/admin/users/{id}/reactivate");

    /** Every endpoint of the API. Adding one here means deciding who may call it (see allowedCallers). */
    static final List<String> ENDPOINTS = List.of(
            "POST /api/auth/login",

            "GET /api/student/dashboard",
            "GET /api/student/profile",
            "PUT /api/student/profile",
            "GET /api/student/available-courses",
            "POST /api/student/register-course/{courseId}",
            "GET /api/student/exam-calendar",
            "GET /api/student/weekly-schedule",
            "GET /api/student/transcript",
            "GET /api/student/attendance",
            "POST /api/student/simulate-gpa",
            "GET /api/student/registration/available-courses",
            "POST /api/student/registration/enroll",

            "GET /api/academician/profile",
            "PUT /api/academician/profile",
            "GET /api/academician/courses",
            "GET /api/academician/courses/{courseId}/students",
            "GET /api/academician/advisees",
            "PUT /api/academician/courses/{courseId}/syllabus",
            "GET /api/academician/schedule",
            "GET /api/academician/advisees/performance",
            "POST /api/academician/courses/{courseId}/exams",
            "PUT /api/academician/exams/{examId}",
            "DELETE /api/academician/exams/{examId}",
            "GET /api/academician/courses/{courseId}/exams",
            "GET /api/academician/exams/{examId}/grades",
            "POST /api/academician/exams/{examId}/grades",
            "POST /api/academician/courses/{courseId}/finalize-grades",
            "POST /api/academician/exams/{examId}/grade-corrections",
            "POST /api/academician/courses/{courseId}/attendance",
            "GET /api/academician/courses/{courseId}/attendance/today",
            "PUT /api/academician/courses/{courseId}/open",
            "POST /api/academician/advisees/{studentId}/message",
            "GET /api/academician/advisees/enrollments/pending",
            "PUT /api/academician/enrollments/{enrollmentId}/approve",
            "PUT /api/academician/enrollments/{enrollmentId}/reject",
            "POST /api/academician/courses/{courseId}/announcements",
            "GET /api/academician/courses/{courseId}/announcements",
            "POST /api/academician/office-hours",
            "GET /api/academician/office-hours",
            "GET /api/academician/courses/{courseId}/analytics",
            "GET /api/academician/courses/{courseId}/schedule",
            "GET /api/academician/all-students",
            "GET /api/academician/courses/{courseId}/export-grades",
            "GET /api/academician/advisees/export",

            "GET /api/admin/academics/semesters",
            "POST /api/admin/academics/semesters",
            "PUT /api/admin/academics/semesters/{id}",
            "PATCH /api/admin/academics/semesters/{id}/activate",
            "GET /api/admin/academics/courses",
            "POST /api/admin/academics/courses",
            "PUT /api/admin/academics/courses/{id}",
            "POST /api/admin/academics/courses/{courseId}/assign-instructor/{instructorId}",
            "DELETE /api/admin/academics/courses/{id}",
            "GET /api/admin/infrastructure/faculties",
            "POST /api/admin/infrastructure/faculties",
            "PUT /api/admin/infrastructure/faculties/{id}",
            "DELETE /api/admin/infrastructure/faculties/{id}",
            "GET /api/admin/infrastructure/departments",
            "POST /api/admin/infrastructure/departments",
            "PUT /api/admin/infrastructure/departments/{id}",
            "DELETE /api/admin/infrastructure/departments/{id}",
            "GET /api/admin/infrastructure/classrooms",
            "POST /api/admin/infrastructure/classrooms",
            "PUT /api/admin/infrastructure/classrooms/{id}",
            "DELETE /api/admin/infrastructure/classrooms/{id}",
            "GET /api/admin/operations/stats",
            "GET /api/admin/operations/logs",
            "POST /api/admin/operations/announcement",
            "POST /api/admin/users/students",
            "POST /api/admin/users/academicians",
            "POST /api/admin/users/administrative",
            "PUT /api/admin/users/students/{studentId}/assign-advisor/{advisorId}",
            "GET /api/admin/users/students",
            "GET /api/admin/users/academicians",
            "GET /api/admin/users/academicians/options",
            "GET /api/admin/users/administrative",
            "PUT /api/admin/users/students/{id}",
            "PUT /api/admin/users/academicians/{id}",
            "PUT /api/admin/users/administrative/{id}",
            "DELETE /api/admin/users/{id}",
            "PATCH /api/admin/users/{id}/reactivate",
            "GET /api/admin/users/profile",
            "PUT /api/admin/users/profile",

            "GET /api/chat/conversations",
            "GET /api/chat/messages/{userId}",
            "POST /api/chat/send",
            "GET /api/chat/search",

            "GET /api/todos",
            "POST /api/todos",
            "PUT /api/todos/{id}",
            "DELETE /api/todos/{id}",
            "PATCH /api/todos/{id}/toggle");

    /** The access rule: who may get past the security filter. Empty set means public. */
    static Set<Caller> allowedCallers(String endpoint) {
        String path = endpoint.substring(endpoint.indexOf(' ') + 1);
        if (path.startsWith("/api/auth/")) return EnumSet.allOf(Caller.class);
        if (ADMIN_ONLY.contains(endpoint)) return EnumSet.of(Caller.ADMIN);
        if (path.startsWith("/api/admin/")) return EnumSet.of(Caller.STAFF, Caller.ADMIN);
        if (path.startsWith("/api/academician")) return EnumSet.of(Caller.ACADEMICIAN);
        if (path.startsWith("/api/student/")) return EnumSet.of(Caller.STUDENT);
        // Chat and to-dos are for everyone signed in; the services scope them to the caller
        return AUTHENTICATED;
    }

    @Autowired private MockMvc mockMvc;
    @Autowired private TestDataFactory data;
    @Autowired private AuthHelper auth;
    @Autowired @Qualifier("requestMappingHandlerMapping") private RequestMappingHandlerMapping handlerMapping;

    private final Map<Caller, User> users = new EnumMap<>(Caller.class);

    /** Committed once for the whole matrix; each call below runs in its own rolled-back transaction. */
    @BeforeAll
    void createOneUserPerRole() {
        Department department = data.department();
        Academician academician = data.academician(department);
        users.put(Caller.ACADEMICIAN, academician);
        users.put(Caller.STUDENT, data.student(department, academician));
        users.put(Caller.STAFF, data.staff(Role.ADMINISTRATIVE));
        users.put(Caller.ADMIN, data.staff(Role.ADMIN));
    }

    @Test
    void everyEndpointIsInTheMatrix() {
        Set<String> actual = new TreeSet<>();
        for (Map.Entry<RequestMappingInfo, HandlerMethod> entry : handlerMapping.getHandlerMethods().entrySet()) {
            if (!entry.getValue().getBeanType().getPackageName().startsWith("com.obs.backend")) {
                continue; // Spring's own /error controller
            }
            RequestMappingInfo info = entry.getKey();
            for (String pattern : info.getPatternValues()) {
                info.getMethodsCondition().getMethods().forEach(m -> actual.add(m.name() + " " + pattern));
            }
        }

        assertThat(actual)
                .as("Endpoints missing from or stale in AccessMatrixIntegrationTest.ENDPOINTS")
                .containsExactlyInAnyOrderElementsOf(ENDPOINTS);
    }

    Stream<Arguments> matrix() {
        return ENDPOINTS.stream()
                .filter(e -> !e.equals("POST /api/auth/login")) // rate limited; covered by its own tests
                .flatMap(e -> Arrays.stream(Caller.values()).map(c -> Arguments.of(e, c)));
    }

    @ParameterizedTest(name = "{1} -> {0}")
    @MethodSource("matrix")
    void callersWithoutTheRoleAreStoppedAtTheFilter(String endpoint, Caller caller) throws Exception {
        String[] parts = endpoint.split(" ", 2);
        HttpMethod method = HttpMethod.valueOf(parts[0]);
        // Ids that exist nowhere: the call never reaches anyone's data
        String uri = parts[1].replaceAll("\\{[^}]+}", "999999");

        MockHttpServletRequestBuilder call = request(method, uri);
        if (method == HttpMethod.POST || method == HttpMethod.PUT || method == HttpMethod.PATCH) {
            call.contentType(MediaType.APPLICATION_JSON).content("{}");
        }
        if (caller != Caller.ANONYMOUS) {
            call.with(auth.as(users.get(caller)));
        }
        MockHttpServletResponse response = mockMvc.perform(call).andReturn().getResponse();
        int status = response.getStatus();
        boolean stoppedByFilter = status == 401 || (status == 403 && response.getContentAsString().isEmpty());

        if (allowedCallers(endpoint).contains(caller)) {
            assertThat(stoppedByFilter)
                    .as("%s should reach %s but got %d", caller, endpoint, status)
                    .isFalse();
        } else {
            assertThat(status)
                    .as("%s must not reach %s", caller, endpoint)
                    .isEqualTo(caller == Caller.ANONYMOUS ? 401 : 403);
            assertThat(response.getContentAsString()).as("rejected before any handler ran").isEmpty();
        }
    }
}
