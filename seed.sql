-- OBS SYSTEM CLEAN & SEED DATA - FINAL VERSION
-- WARNING: This will delete all existing data!

-- 0. CLEANUP
TRUNCATE TABLE grades, exams, enrollments, schedules, todo_items, chat_messages, 
               students, academicians, users, courses, semesters, departments, faculties, classrooms 
               RESTART IDENTITY CASCADE;

-- 1. FACULTIES
INSERT INTO faculties (name) VALUES ('Faculty of Engineering'); -- ID: 1
INSERT INTO faculties (name) VALUES ('Faculty of Business');    -- ID: 2

-- 2. DEPARTMENTS
INSERT INTO departments (name, faculty_id) VALUES ('Computer Engineering', 1); -- ID: 1
INSERT INTO departments (name, faculty_id) VALUES ('Business Administration', 2); -- ID: 2

-- 3. SEMESTERS (ONLY name and is_active as per model)
INSERT INTO semesters (name, is_active) VALUES ('2023-2024 Fall', true); -- ID: 1
INSERT INTO semesters (name, is_active) VALUES ('2023-2024 Spring', false); -- ID: 2

-- 4. USERS
-- Password: password123
INSERT INTO users (username, password, email, first_name, last_name, role, is_active)
VALUES ('admin', 'password123', 'admin@obs.edu.tr', 'System', 'Admin', 'ADMIN', true); -- ID: 1

INSERT INTO users (username, password, email, first_name, last_name, role, is_active)
VALUES ('hoca1', 'password123', 'hoca1@uni.edu.tr', 'Instructor', 'One', 'ACADEMICIAN', true); -- ID: 2
INSERT INTO users (username, password, email, first_name, last_name, role, is_active)
VALUES ('hoca2', 'password123', 'hoca2@uni.edu.tr', 'Professor', 'Two', 'ACADEMICIAN', true); -- ID: 3

INSERT INTO users (username, password, email, first_name, last_name, role, is_active)
VALUES ('2024001', 'password123', 'berat.zengin@uni.edu.tr', 'Berat', 'Zengin', 'STUDENT', true); -- ID: 4
INSERT INTO users (username, password, email, first_name, last_name, role, is_active)
VALUES ('2024002', 'password123', 'ahmet.yilmaz@uni.edu.tr', 'Ahmet', 'Yilmaz', 'STUDENT', true); -- ID: 5

-- 5. ACADEMICIANS
INSERT INTO academicians (id, staff_number, academic_title, department_id, office_number, phone_number)
VALUES (2, 'STAFF001', 'Prof. Dr.', 1, 'A-101', '+90 555 111 2233');
INSERT INTO academicians (id, staff_number, academic_title, department_id, office_number, phone_number)
VALUES (3, 'STAFF002', 'Assoc. Prof.', 2, 'B-202', '+90 555 222 3344');

-- 6. STUDENTS
-- Berat Zengin (Advisor is hoca1-ID:2)
INSERT INTO students (id, student_number, department_id, advisor_id, current_semester, gpa, registration_date)
VALUES (4, '2024001', 1, 2, 1, 3.50, '2023-09-01');
INSERT INTO students (id, student_number, department_id, advisor_id, current_semester, gpa, registration_date)
VALUES (5, '2024002', 1, 2, 1, 3.00, '2023-09-01');

-- 7. COURSES (Includes semester_level)
INSERT INTO courses (code, name, akts, credits, department_id, instructor_id, semester_level, language, open, quota)
VALUES ('CS101', 'Introduction to Programming', 6, 4, 1, 2, 1, 'English', true, 50); -- ID: 1
INSERT INTO courses (code, name, akts, credits, department_id, instructor_id, semester_level, language, open, quota)
VALUES ('CS102', 'Data Structures', 6, 4, 1, 2, 1, 'English', true, 50); -- ID: 2
INSERT INTO courses (code, name, akts, credits, department_id, instructor_id, semester_level, language, open, quota)
VALUES ('CS201', 'Database Systems', 6, 3, 1, 2, 2, 'English', true, 50); -- ID: 3

-- 8. CLASSROOMS
INSERT INTO classrooms (code, capacity, location) VALUES ('ENG-101', 50, 'Engineering Building'); -- ID: 1
INSERT INTO classrooms (code, capacity, location) VALUES ('ENG-102', 40, 'Engineering Building'); -- ID: 2

-- 9. SCHEDULES
INSERT INTO schedules (course_id, classroom_id, day_of_week, start_time, end_time)
VALUES (1, 1, 'MONDAY', '09:00:00', '12:00:00');
INSERT INTO schedules (course_id, classroom_id, day_of_week, start_time, end_time)
VALUES (2, 2, 'TUESDAY', '13:00:00', '16:00:00');

-- 10. ENROLLMENTS (Links to Semester ID: 1)
INSERT INTO enrollments (student_id, course_id, semester_id, status, grade, score)
VALUES (4, 1, 1, 'ACTIVE', 'AA', 92.5); -- ID: 1
INSERT INTO enrollments (student_id, course_id, semester_id, status, grade, score)
VALUES (4, 2, 1, 'ACTIVE', 'BA', 84.0); -- ID: 2

-- 11. EXAMS
INSERT INTO exams (exam_type, exam_date, ratio, course_id, classroom_id, semester_id)
VALUES ('MIDTERM', '2023-11-10 10:00:00', 0.4, 1, 1, 1); -- ID: 1
INSERT INTO exams (exam_type, exam_date, ratio, course_id, classroom_id, semester_id)
VALUES ('FINAL', '2024-01-05 14:00:00', 0.6, 1, 1, 1); -- ID: 2

-- 12. GRADES (Individual exam scores)
INSERT INTO grades (enrollment_id, exam_id, score) VALUES (1, 1, 88.0);
INSERT INTO grades (enrollment_id, exam_id, score) VALUES (1, 2, 95.0);

-- 13. CHAT MESSAGES
INSERT INTO chat_messages (sender_id, receiver_id, content, timestamp, is_read)
VALUES (2, 4, 'Hello Berat, welcome to the new semester!', CURRENT_TIMESTAMP, false);

-- 14. TODO ITEMS
INSERT INTO todo_items (student_id, title, description, due_date, priority, is_completed)
VALUES (4, 'Complete OBS Project', 'Finalize the UI and Backend integration', '2023-12-30', 'HIGH', false);
