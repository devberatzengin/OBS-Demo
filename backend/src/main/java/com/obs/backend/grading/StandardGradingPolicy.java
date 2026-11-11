package com.obs.backend.grading;

import org.springframework.stereotype.Component;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * The 4.00 scale used by the university: AA (90+) down to FF (below 50).
 * Only FF is a failing grade (plan decision K5); FD passes with 0.5 points.
 */
@Component
public class StandardGradingPolicy implements GradingPolicy {

    /** Lower score bound of each letter, highest first. */
    private static final Map<String, Double> THRESHOLDS = new LinkedHashMap<>();
    private static final Map<String, Double> POINTS = Map.of(
            "AA", 4.0, "BA", 3.5, "BB", 3.0, "CB", 2.5, "CC", 2.0,
            "DC", 1.5, "DD", 1.0, "FD", 0.5, "FF", 0.0);

    static {
        THRESHOLDS.put("AA", 90.0);
        THRESHOLDS.put("BA", 85.0);
        THRESHOLDS.put("BB", 80.0);
        THRESHOLDS.put("CB", 75.0);
        THRESHOLDS.put("CC", 70.0);
        THRESHOLDS.put("DC", 65.0);
        THRESHOLDS.put("DD", 60.0);
        THRESHOLDS.put("FD", 50.0);
    }

    @Override
    public String letterFor(double score) {
        // Weighted sums like 80*0.4 + 90*0.6 can land on 85.99999999; compare at two decimals
        double rounded = Math.round(score * 100.0) / 100.0;
        for (Map.Entry<String, Double> threshold : THRESHOLDS.entrySet()) {
            if (rounded >= threshold.getValue()) {
                return threshold.getKey();
            }
        }
        return "FF";
    }

    @Override
    public Double pointsFor(String letter) {
        return letter == null ? null : POINTS.get(letter);
    }

    @Override
    public boolean isFailing(String letter) {
        return "FF".equals(letter);
    }
}
