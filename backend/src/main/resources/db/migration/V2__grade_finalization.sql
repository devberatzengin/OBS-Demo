-- Plan 2.2 (decision K1): a letter grade exists only after the instructor finalizes the course.

ALTER TABLE enrollments ADD COLUMN grade_finalized_at TIMESTAMP(6);

-- Grades that already have a real letter were final under the old behaviour: keep them final.
UPDATE enrollments
SET grade_finalized_at = now()
WHERE grade IN ('AA', 'BA', 'BB', 'CB', 'CC', 'DC', 'DD', 'FD', 'FF');

-- "N/A" was only a placeholder for "no grade yet".
UPDATE enrollments SET grade = NULL WHERE grade = 'N/A';
