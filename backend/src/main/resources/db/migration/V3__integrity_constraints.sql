-- Plan 3.3: let the database enforce the rules the services rely on.
-- Existing duplicates and out-of-range values are cleaned up first, so the constraints
-- can be added to a database that already holds data.

-- 1. Duplicate enrollments (same student, course and semester) -------------------------------
-- Keep the most meaningful row: approved before pending before rejected, finalized first,
-- then the oldest. Grades and attendance of the dropped rows move to the kept row.
CREATE TEMPORARY TABLE enrollment_merge AS
SELECT id AS drop_id, keep_id
FROM (
    SELECT id,
           first_value(id) OVER (
               PARTITION BY student_id, course_id, semester_id
               ORDER BY CASE status WHEN 'APPROVED' THEN 0 WHEN 'PENDING' THEN 1 ELSE 2 END,
                        grade_finalized_at IS NULL,
                        id
           ) AS keep_id
    FROM enrollments
) ranked
WHERE id <> keep_id;

-- A grade or attendance entry the kept row already has wins over the moved one
DELETE FROM grades g
USING enrollment_merge m
WHERE g.enrollment_id = m.drop_id
  AND EXISTS (SELECT 1 FROM grades k WHERE k.enrollment_id = m.keep_id AND k.exam_id = g.exam_id);
UPDATE grades g SET enrollment_id = m.keep_id
FROM enrollment_merge m
WHERE g.enrollment_id = m.drop_id;

DELETE FROM attendance_records a
USING enrollment_merge m
WHERE a.enrollment_id = m.drop_id
  AND EXISTS (SELECT 1 FROM attendance_records k
              WHERE k.enrollment_id = m.keep_id AND k.attendance_date = a.attendance_date);
UPDATE attendance_records a SET enrollment_id = m.keep_id
FROM enrollment_merge m
WHERE a.enrollment_id = m.drop_id;

DELETE FROM enrollments e USING enrollment_merge m WHERE e.id = m.drop_id;
DROP TABLE enrollment_merge;

-- 2. Duplicate grades (same enrollment and exam) and attendance (same enrollment and day) -----
-- The latest entry (highest id) is the one the services showed, so it stays.
DELETE FROM grades g
USING grades newer
WHERE newer.enrollment_id = g.enrollment_id AND newer.exam_id = g.exam_id AND newer.id > g.id;

DELETE FROM attendance_records a
USING attendance_records newer
WHERE newer.enrollment_id = a.enrollment_id AND newer.attendance_date = a.attendance_date AND newer.id > a.id;

-- 3. At most one active semester: keep the latest one active -----------------------------------
UPDATE semesters SET is_active = false
WHERE is_active
  AND id <> (SELECT id FROM semesters WHERE is_active
             ORDER BY start_date DESC NULLS LAST, id DESC LIMIT 1);

-- 4. Out-of-range values -------------------------------------------------------------------
UPDATE grades      SET score = LEAST(GREATEST(score, 0), 100) WHERE score < 0 OR score > 100;
UPDATE enrollments SET score = LEAST(GREATEST(score, 0), 100) WHERE score < 0 OR score > 100;
UPDATE courses     SET quota = NULL WHERE quota < 0;  -- decision K8: no quota means unlimited

-- 5. Constraints ----------------------------------------------------------------------------
ALTER TABLE enrollments
    ADD CONSTRAINT uk_enrollments_student_course_semester UNIQUE (student_id, course_id, semester_id),
    ADD CONSTRAINT ck_enrollments_score CHECK (score IS NULL OR score BETWEEN 0 AND 100);

ALTER TABLE grades
    ADD CONSTRAINT uk_grades_enrollment_exam UNIQUE (enrollment_id, exam_id),
    ADD CONSTRAINT ck_grades_score CHECK (score BETWEEN 0 AND 100);

ALTER TABLE attendance_records
    ADD CONSTRAINT uk_attendance_enrollment_date UNIQUE (enrollment_id, attendance_date);

ALTER TABLE exams
    ADD CONSTRAINT ck_exams_ratio CHECK (ratio > 0 AND ratio <= 100);

ALTER TABLE courses
    ADD CONSTRAINT ck_courses_akts CHECK (akts > 0),
    ADD CONSTRAINT ck_courses_quota CHECK (quota IS NULL OR quota >= 0);

CREATE UNIQUE INDEX uk_semesters_single_active ON semesters (is_active) WHERE is_active;

-- 6. Indexes for the common lookups (the unique constraints above already index
--    enrollments(student_id, ...), grades(enrollment_id, ...) and attendance(enrollment_id, ...))
CREATE INDEX ix_enrollments_course_semester_status ON enrollments (course_id, semester_id, status);
CREATE INDEX ix_schedules_course ON schedules (course_id);
CREATE INDEX ix_exams_course_semester ON exams (course_id, semester_id);
CREATE INDEX ix_chat_messages_sender_receiver ON chat_messages (sender_id, receiver_id);
CREATE INDEX ix_chat_messages_receiver_sender ON chat_messages (receiver_id, sender_id);
CREATE INDEX ix_notifications_user ON notifications (user_id);
