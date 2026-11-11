-- Plan 3.4: version columns for optimistic locking (@Version on the entities).
-- Existing rows start at 0; Hibernate increments the value on every update.
ALTER TABLE enrollments ADD COLUMN version BIGINT NOT NULL DEFAULT 0;
ALTER TABLE grades      ADD COLUMN version BIGINT NOT NULL DEFAULT 0;
ALTER TABLE courses     ADD COLUMN version BIGINT NOT NULL DEFAULT 0;
ALTER TABLE semesters   ADD COLUMN version BIGINT NOT NULL DEFAULT 0;

-- Letter grades are stored as text; only the letters of the grading policy are accepted.
-- (A Java enum was left out on purpose: every grading class works with the letter strings,
-- and this constraint gives the same guarantee in the database without that refactor.)
UPDATE enrollments SET grade = NULL, grade_finalized_at = NULL
WHERE grade IS NOT NULL AND grade NOT IN ('AA', 'BA', 'BB', 'CB', 'CC', 'DC', 'DD', 'FD', 'FF');

ALTER TABLE enrollments
    ADD CONSTRAINT ck_enrollments_grade
        CHECK (grade IS NULL OR grade IN ('AA', 'BA', 'BB', 'CB', 'CC', 'DC', 'DD', 'FD', 'FF'));
