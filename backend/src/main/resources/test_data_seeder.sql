-- ======================================================
-- OBS MEGA TEST DATA SEEDER (V4 - ENTITY ALIGNED)
-- ======================================================

-- 1. TEMİZLİK
DELETE FROM chat_messages;
DELETE FROM todo_items;
DELETE FROM attendance_records;
DELETE FROM enrollments;
DELETE FROM schedules;
DELETE FROM exams;
DELETE FROM classrooms;
DELETE FROM courses;
DELETE FROM semesters;
DELETE FROM students;
DELETE FROM academicians;
DELETE FROM users;
DELETE FROM departments;
DELETE FROM faculties;

-- 2. KURUMSAL YAPI
INSERT INTO faculties (name) VALUES ('Mühendislik Fakültesi');
INSERT INTO faculties (name) VALUES ('İktisadi ve İdari Bilimler Fakültesi');

INSERT INTO departments (name, faculty_id) VALUES ('Bilgisayar Mühendisliği', (SELECT id FROM faculties WHERE name = 'Mühendislik Fakültesi'));
INSERT INTO departments (name, faculty_id) VALUES ('Yazılım Mühendisliği', (SELECT id FROM faculties WHERE name = 'Mühendislik Fakültesi'));

-- 3. AKADEMİSYENLER (Hocalar ve Danışmanlar)
-- Sifre: password123 ($2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07xd00DMxs.7uqqCyS)
-- Role must match Enum names: STUDENT, ACADEMICIAN, ADMIN
INSERT INTO users (username, password, email, first_name, last_name, role, is_active) 
VALUES ('hocam01', '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07xd00DMxs.7uqqCyS', 'ahmet.hoca@uni.edu.tr', 'Ahmet', 'Yılmaz', 'ACADEMICIAN', true);
INSERT INTO users (username, password, email, first_name, last_name, role, is_active) 
VALUES ('hocam02', '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07xd00DMxs.7uqqCyS', 'ayse.hoca@uni.edu.tr', 'Ayşe', 'Kaya', 'ACADEMICIAN', true);

-- Columns match Academician.java: academic_title, staff_number
INSERT INTO academicians (id, academic_title, department_id, staff_number) 
VALUES ((SELECT id FROM users WHERE username = 'hocam01'), 'Prof. Dr.', (SELECT id FROM departments WHERE name = 'Bilgisayar Mühendisliği'), 'EMP001');
INSERT INTO academicians (id, academic_title, department_id, staff_number) 
VALUES ((SELECT id FROM users WHERE username = 'hocam02'), 'Doç. Dr.', (SELECT id FROM departments WHERE name = 'Bilgisayar Mühendisliği'), 'EMP002');

-- 4. ÖĞRENCİLER
INSERT INTO users (username, password, email, first_name, last_name, role, is_active) 
VALUES ('2024001', '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07xd00DMxs.7uqqCyS', 'berat@uni.edu.tr', 'Berat', 'Zengin', 'STUDENT', true);
INSERT INTO users (username, password, email, first_name, last_name, role, is_active) 
VALUES ('2024002', '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07xd00DMxs.7uqqCyS', 'veli@uni.edu.tr', 'Veli', 'Can', 'STUDENT', true);

-- Columns match Student.java: advisor_id, gpa, current_semester
INSERT INTO students (id, student_number, department_id, advisor_id, gpa, current_semester) 
VALUES ((SELECT id FROM users WHERE username = '2024001'), '2024001', 
        (SELECT id FROM departments WHERE name = 'Bilgisayar Mühendisliği'), 
        (SELECT id FROM academicians WHERE staff_number = 'EMP001'), 3.45, 2);

-- 5. AKADEMİK TAKVİM
INSERT INTO semesters (name, is_active) VALUES ('2023-2024 Güz', false);
INSERT INTO semesters (name, is_active) VALUES ('2023-2024 Bahar', true);

-- 6. DERSLİKLER (Classroom.java has no 'type' field)
INSERT INTO classrooms (code, capacity) VALUES ('A-101', 80);
INSERT INTO classrooms (code, capacity) VALUES ('B-205', 40);

-- 7. DERS KATALOĞU
INSERT INTO courses (code, name, akts, credit, department_id, instructor_id, semester_level) 
VALUES ('MAT101', 'Matematik I', 6, 4, (SELECT id FROM departments WHERE name = 'Bilgisayar Mühendisliği'), (SELECT id FROM academicians WHERE staff_number = 'EMP001'), 1);
INSERT INTO courses (code, name, akts, credit, department_id, instructor_id, semester_level) 
VALUES ('CSE101', 'Programlamaya Giriş', 5, 4, (SELECT id FROM departments WHERE name = 'Bilgisayar Mühendisliği'), (SELECT id FROM academicians WHERE staff_number = 'EMP002'), 1);
INSERT INTO courses (code, name, akts, credit, department_id, instructor_id, semester_level) 
VALUES ('CSE201', 'Veri Yapıları', 7, 5, (SELECT id FROM departments WHERE name = 'Bilgisayar Mühendisliği'), (SELECT id FROM academicians WHERE staff_number = 'EMP001'), 2);
INSERT INTO courses (code, name, akts, credit, department_id, instructor_id, semester_level) 
VALUES ('CSE202', 'Veritabanı Sistemleri', 6, 4, (SELECT id FROM departments WHERE name = 'Bilgisayar Mühendisliği'), (SELECT id FROM academicians WHERE staff_number = 'EMP002'), 2);

-- ÇAKIŞMA TESTİ
INSERT INTO courses (code, name, akts, credit, department_id, instructor_id, semester_level) 
VALUES ('CSE999', 'Gereksiz Çakışan Ders', 2, 2, (SELECT id FROM departments WHERE name = 'Bilgisayar Mühendisliği'), (SELECT id FROM academicians WHERE staff_number = 'EMP001'), 2);

-- 8. HAFTALIK PROGRAM
INSERT INTO schedules (course_id, classroom_id, day_of_week, start_time, end_time) 
VALUES ((SELECT id FROM courses WHERE code = 'MAT101'), (SELECT id FROM classrooms WHERE code = 'A-101'), 'MONDAY', '09:00:00', '12:00:00');
INSERT INTO schedules (course_id, classroom_id, day_of_week, start_time, end_time) 
VALUES ((SELECT id FROM courses WHERE code = 'CSE101'), (SELECT id FROM classrooms WHERE code = 'B-205'), 'TUESDAY', '14:00:00', '17:00:00');
INSERT INTO schedules (course_id, classroom_id, day_of_week, start_time, end_time) 
VALUES ((SELECT id FROM courses WHERE code = 'CSE201'), (SELECT id FROM classrooms WHERE code = 'A-101'), 'TUESDAY', '13:00:00', '16:00:00');
INSERT INTO schedules (course_id, classroom_id, day_of_week, start_time, end_time) 
VALUES ((SELECT id FROM courses WHERE code = 'CSE202'), (SELECT id FROM classrooms WHERE code = 'B-205'), 'WEDNESDAY', '10:00:00', '13:00:00');

-- ÇAKIŞMA İÇİN BİLİNÇLİ SEÇİM (CSE201 ile çakışır)
INSERT INTO schedules (course_id, classroom_id, day_of_week, start_time, end_time) 
VALUES ((SELECT id FROM courses WHERE code = 'CSE999'), (SELECT id FROM classrooms WHERE code = 'A-101'), 'TUESDAY', '14:00:00', '15:00:00');

-- 9. GEÇMİŞ KAYITLAR (TRANSKRİPT İÇİN)
INSERT INTO enrollments (student_id, course_id, semester_id, grade) 
VALUES ((SELECT id FROM students WHERE student_number = '2024001'), (SELECT id FROM courses WHERE code = 'MAT101'), (SELECT id FROM semesters WHERE name = '2023-2024 Güz'), 'FF');
INSERT INTO enrollments (student_id, course_id, semester_id, grade) 
VALUES ((SELECT id FROM students WHERE student_number = '2024001'), (SELECT id FROM courses WHERE code = 'CSE101'), (SELECT id FROM semesters WHERE name = '2023-2024 Güz'), 'BA');

-- 10. SINAVLAR
INSERT INTO exams (course_id, semester_id, exam_type, exam_date, classroom_id, ratio) 
VALUES ((SELECT id FROM courses WHERE code = 'CSE201'), (SELECT id FROM semesters WHERE name = '2023-2024 Bahar'), 'MIDTERM', '2026-05-20 10:00:00', (SELECT id FROM classrooms WHERE code = 'A-101'), 40);

-- 11. SOSYAL & ORGANİZASYON (FAZ 5)
INSERT INTO todo_items (user_id, title, description, completed, due_date) 
VALUES ((SELECT id FROM users WHERE username = '2024001'), 'Ders Kaydını Tamamla', 'Bahar dönemi seçimlerini yapmalısın.', false, '2026-04-30 23:59:00');

INSERT INTO chat_messages (sender_id, receiver_id, content, timestamp, is_read) 
VALUES ((SELECT id FROM users WHERE username = 'hocam01'), (SELECT id FROM users WHERE username = '2024001'), 'Hoş geldin Berat. Akademik planın hakkında konuşabiliriz.', NOW(), false);
