package com.obs.backend.grading;

/**
 * How a course score becomes a letter grade and how letters count towards the GPA.
 * One implementation per grading regulation (Strategy); the current one is {@link StandardGradingPolicy}.
 */
public interface GradingPolicy {

    /** Letter grade for a weighted course score between 0 and 100. */
    String letterFor(double score);

    /** Grade points of a letter on the 4.00 scale, or null if the letter does not count (unknown). */
    Double pointsFor(String letter);

    /** Whether the letter means the course was failed and has to be taken again. */
    boolean isFailing(String letter);

    /**
     * Whether a course finished with this letter may be registered again: always after a fail,
     * and for low passing letters that the regulation lets students raise.
     */
    boolean mayRetake(String letter);

    default boolean isKnownLetter(String letter) {
        return pointsFor(letter) != null;
    }
}
