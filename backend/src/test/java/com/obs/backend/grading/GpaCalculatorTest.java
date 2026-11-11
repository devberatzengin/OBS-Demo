package com.obs.backend.grading;

import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.within;

class GpaCalculatorTest {

    private final GpaCalculator calculator = new GpaCalculator(new StandardGradingPolicy());

    private static final LocalDate FALL_2024 = LocalDate.of(2024, 9, 16);
    private static final LocalDate SPRING_2025 = LocalDate.of(2025, 2, 10);

    private static CourseAttempt attempt(long courseId, int akts, String letter, LocalDate semesterStart, long semesterId) {
        return new CourseAttempt(courseId, "C" + courseId, akts, letter, semesterStart, semesterId);
    }

    @Test
    void averageIsWeightedByEcts() {
        // (4.0*6 + 2.0*4) / 10 = 3.2
        Double gpa = calculator.average(List.of(
                attempt(1, 6, "AA", FALL_2024, 1),
                attempt(2, 4, "CC", FALL_2024, 1)));

        assertThat(gpa).isCloseTo(3.2, within(1e-9));
    }

    @Test
    void lettersWithoutPointsAreIgnored() {
        Double gpa = calculator.average(List.of(
                attempt(1, 5, "BB", FALL_2024, 1),
                attempt(2, 5, null, FALL_2024, 1),
                attempt(3, 5, "N/A", FALL_2024, 1)));

        assertThat(gpa).isEqualTo(3.0);
    }

    @Test
    void nothingGradedYetGivesNull() {
        assertThat(calculator.average(List.of())).isNull();
        assertThat(calculator.cumulative(List.of(attempt(1, 5, null, FALL_2024, 1)))).isNull();
    }

    @Test
    void retakenCourseCountsOnlyTheLatestAttempt() {
        // Course 1 failed in fall, passed with BA in spring; course 2 BB.
        // Latest attempts only: (3.5*5 + 3.0*5) / 10 = 3.25. Counting both attempts would give 2.17.
        Double gno = calculator.cumulative(List.of(
                attempt(1, 5, "FF", FALL_2024, 1),
                attempt(1, 5, "BA", SPRING_2025, 2),
                attempt(2, 5, "BB", FALL_2024, 1)));

        assertThat(gno).isCloseTo(3.25, within(1e-9));
    }

    @Test
    void latestAttemptWinsEvenWhenItIsLower() {
        Double gno = calculator.cumulative(List.of(
                attempt(1, 5, "AA", FALL_2024, 1),
                attempt(1, 5, "DD", SPRING_2025, 2)));

        assertThat(gno).isEqualTo(1.0);
    }

    @Test
    void semestersWithoutDatesAreOrderedById() {
        Double gno = calculator.cumulative(List.of(
                attempt(1, 5, "CC", null, 7),
                attempt(1, 5, "AA", null, 9)));

        assertThat(gno).isEqualTo(4.0);
    }
}
