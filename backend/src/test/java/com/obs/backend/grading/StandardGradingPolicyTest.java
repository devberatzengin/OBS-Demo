package com.obs.backend.grading;

import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class StandardGradingPolicyTest {

    private final GradingPolicy policy = new StandardGradingPolicy();

    @ParameterizedTest(name = "{0} -> {1}")
    @CsvSource({
            "100, AA", "90, AA", "89.99, BA", "85, BA", "84.99, BB", "80, BB", "75, CB", "70, CC",
            "65, DC", "60, DD", "59.99, FD", "50, FD", "49.99, FF", "0, FF"
    })
    void lettersFollowTheThresholds(double score, String letter) {
        assertThat(policy.letterFor(score)).isEqualTo(letter);
    }

    @Test
    void floatingPointNoiseDoesNotDropAGrade() {
        // 80*0.4 + 90*0.6 is 86 on paper; sums like this can come out a hair below a boundary
        assertThat(policy.letterFor(84.99999999999999)).isEqualTo("BA");
    }

    @Test
    void onlyFfIsFailing() {
        assertThat(policy.isFailing("FF")).isTrue();
        assertThat(policy.isFailing("FD")).isFalse();
        assertThat(policy.isFailing(null)).isFalse();
    }

    @Test
    void pointsOnTheFourScale() {
        assertThat(policy.pointsFor("AA")).isEqualTo(4.0);
        assertThat(policy.pointsFor("CB")).isEqualTo(2.5);
        assertThat(policy.pointsFor("FD")).isEqualTo(0.5);
        assertThat(policy.pointsFor("FF")).isEqualTo(0.0);
        assertThat(policy.pointsFor("N/A")).isNull();
        assertThat(policy.pointsFor(null)).isNull();
    }

    @org.junit.jupiter.api.Test
    void onlyFailsAndLowPassesMayBeRetaken() {
        assertThat(policy.mayRetake("FF")).isTrue();
        assertThat(policy.mayRetake("DD")).isTrue();
        assertThat(policy.mayRetake("DC")).isTrue();
        assertThat(policy.mayRetake("FD")).isFalse();
        assertThat(policy.mayRetake("CC")).isFalse();
        assertThat(policy.mayRetake("AA")).isFalse();
    }
}
