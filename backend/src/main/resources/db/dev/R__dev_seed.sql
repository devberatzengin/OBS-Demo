-- ======================================================
-- OBS DEV SEED (Flyway repeatable migration, sadece dev profilinde)
-- Tüm hesapların şifresi: password123
-- ======================================================

-- 1. TEMİZLİK: tüm uygulama tablolarını boşalt (dosya her değiştiğinde Flyway bunu yeniden çalıştırır)
TRUNCATE TABLE
    attendance_records, grades, enrollments, exams, schedules, announcements,
    office_hours, notifications, chat_messages, todo_items, system_logs,
    courses, classrooms, semesters,
    students, academicians, administratives, users,
    departments, faculties
RESTART IDENTITY CASCADE;

-- 2. KURUMSAL YAPI
INSERT INTO faculties (name) VALUES ('Mühendislik Fakültesi');
INSERT INTO faculties (name) VALUES ('İktisadi ve İdari Bilimler Fakültesi');

INSERT INTO departments (name, faculty_id) VALUES ('Bilgisayar Mühendisliği', (SELECT id FROM faculties WHERE name = 'Mühendislik Fakültesi'));
INSERT INTO departments (name, faculty_id) VALUES ('Yazılım Mühendisliği', (SELECT id FROM faculties WHERE name = 'Mühendislik Fakültesi'));

-- 3. AKADEMİSYENLER
INSERT INTO users (username, password, email, first_name, last_name, role, is_active) 
VALUES ('hocam01', '$2a$10$JipyxFF0pN/1KoeXCIIl0u76fevEbpFVLMFwueCGh1H58T.HgEXNS', 'ahmet.hoca@uni.edu.tr', 'Ahmet', 'Yılmaz', 'ACADEMICIAN', true);
INSERT INTO users (username, password, email, first_name, last_name, role, is_active) 
VALUES ('hocam02', '$2a$10$JipyxFF0pN/1KoeXCIIl0u76fevEbpFVLMFwueCGh1H58T.HgEXNS', 'ayse.hoca@uni.edu.tr', 'Ayşe', 'Kaya', 'ACADEMICIAN', true);

INSERT INTO academicians (id, academic_title, department_id, staff_number) 
VALUES ((SELECT id FROM users WHERE username = 'hocam01'), 'Prof. Dr.', (SELECT id FROM departments WHERE name = 'Bilgisayar Mühendisliği'), 'EMP001');
INSERT INTO academicians (id, academic_title, department_id, staff_number) 
VALUES ((SELECT id FROM users WHERE username = 'hocam02'), 'Doç. Dr.', (SELECT id FROM departments WHERE name = 'Bilgisayar Mühendisliği'), 'EMP002');

-- 4. ÖĞRENCİLER
INSERT INTO users (username, password, email, first_name, last_name, role, is_active) 
VALUES ('2024001', '$2a$10$JipyxFF0pN/1KoeXCIIl0u76fevEbpFVLMFwueCGh1H58T.HgEXNS', 'berat@uni.edu.tr', 'Berat', 'Zengin', 'STUDENT', true);
INSERT INTO users (username, password, email, first_name, last_name, role, is_active) 
VALUES ('2024002', '$2a$10$JipyxFF0pN/1KoeXCIIl0u76fevEbpFVLMFwueCGh1H58T.HgEXNS', 'veli@uni.edu.tr', 'Veli', 'Can', 'STUDENT', true);

INSERT INTO students (id, student_number, department_id, advisor_id, gpa, current_semester) 
VALUES ((SELECT id FROM users WHERE username = '2024001'), '2024001', 
        (SELECT id FROM departments WHERE name = 'Bilgisayar Mühendisliği'), 
        (SELECT id FROM academicians WHERE staff_number = 'EMP001'), 3.45, 2);

-- 4b. YÖNETİCİ VE PERSONEL (Şifre: password123)
INSERT INTO users (username, password, email, first_name, last_name, role, is_active)
VALUES ('admin', '$2a$10$JipyxFF0pN/1KoeXCIIl0u76fevEbpFVLMFwueCGh1H58T.HgEXNS', 'admin@uni.edu.tr', 'System', 'Admin', 'ADMIN', true);
INSERT INTO administratives (id, staff_number, position)
VALUES ((SELECT id FROM users WHERE username = 'admin'), 'ADM001', 'Root Admin');

INSERT INTO users (username, password, email, first_name, last_name, role, is_active)
VALUES ('personel01', '$2a$10$JipyxFF0pN/1KoeXCIIl0u76fevEbpFVLMFwueCGh1H58T.HgEXNS', 'personel@uni.edu.tr', 'Elif', 'Demir', 'ADMINISTRATIVE', true);
INSERT INTO administratives (id, staff_number, position)
VALUES ((SELECT id FROM users WHERE username = 'personel01'), 'STF001', 'Öğrenci İşleri');

-- 5. AKADEMİK TAKVİM
INSERT INTO semesters (name, is_active) VALUES ('2023-2024 Güz', false);
INSERT INTO semesters (name, is_active) VALUES ('2023-2024 Bahar', true);

-- 6. DERSLİKLER
INSERT INTO classrooms (code, capacity) VALUES ('A-101', 80);
INSERT INTO classrooms (code, capacity) VALUES ('B-205', 40);

-- 7. DERS KATALOĞU (open alanı eklendi -> true)
INSERT INTO courses (code, name, akts, credits, department_id, instructor_id, semester_level, open) 
VALUES ('MAT101', 'Matematik I', 6, 4, (SELECT id FROM departments WHERE name = 'Bilgisayar Mühendisliği'), (SELECT id FROM academicians WHERE staff_number = 'EMP001'), 1, true);
INSERT INTO courses (code, name, akts, credits, department_id, instructor_id, semester_level, open) 
VALUES ('CSE101', 'Programlamaya Giriş', 5, 4, (SELECT id FROM departments WHERE name = 'Bilgisayar Mühendisliği'), (SELECT id FROM academicians WHERE staff_number = 'EMP002'), 1, true);
INSERT INTO courses (code, name, akts, credits, department_id, instructor_id, semester_level, open) 
VALUES ('CSE201', 'Veri Yapıları', 7, 5, (SELECT id FROM departments WHERE name = 'Bilgisayar Mühendisliği'), (SELECT id FROM academicians WHERE staff_number = 'EMP001'), 2, true);
INSERT INTO courses (code, name, akts, credits, department_id, instructor_id, semester_level, open) 
VALUES ('CSE202', 'Veritabanı Sistemleri', 6, 4, (SELECT id FROM departments WHERE name = 'Bilgisayar Mühendisliği'), (SELECT id FROM academicians WHERE staff_number = 'EMP002'), 2, true);

-- ÇAKIŞMA TESTİ
INSERT INTO courses (code, name, akts, credits, department_id, instructor_id, semester_level, open) 
VALUES ('CSE999', 'Gereksiz Çakışan Ders', 2, 2, (SELECT id FROM departments WHERE name = 'Bilgisayar Mühendisliği'), (SELECT id FROM academicians WHERE staff_number = 'EMP001'), 2, true);

-- 8. HAFTALIK PROGRAM
INSERT INTO schedules (course_id, classroom_id, day_of_week, start_time, end_time) 
VALUES ((SELECT id FROM courses WHERE code = 'MAT101'), (SELECT id FROM classrooms WHERE code = 'A-101'), 'MONDAY', '09:00:00', '12:00:00');
INSERT INTO schedules (course_id, classroom_id, day_of_week, start_time, end_time) 
VALUES ((SELECT id FROM courses WHERE code = 'CSE101'), (SELECT id FROM classrooms WHERE code = 'B-205'), 'TUESDAY', '14:00:00', '17:00:00');
INSERT INTO schedules (course_id, classroom_id, day_of_week, start_time, end_time) 
VALUES ((SELECT id FROM courses WHERE code = 'CSE201'), (SELECT id FROM classrooms WHERE code = 'A-101'), 'TUESDAY', '13:00:00', '16:00:00');
INSERT INTO schedules (course_id, classroom_id, day_of_week, start_time, end_time) 
VALUES ((SELECT id FROM courses WHERE code = 'CSE202'), (SELECT id FROM classrooms WHERE code = 'B-205'), 'WEDNESDAY', '10:00:00', '13:00:00');

-- ÇAKIŞMA İÇİN BİLİNÇLİ SEÇİM
INSERT INTO schedules (course_id, classroom_id, day_of_week, start_time, end_time) 
VALUES ((SELECT id FROM courses WHERE code = 'CSE999'), (SELECT id FROM classrooms WHERE code = 'A-101'), 'TUESDAY', '14:00:00', '15:00:00');

-- 9. GEÇMİŞ KAYITLAR
INSERT INTO enrollments (student_id, course_id, semester_id, grade, status) 
VALUES ((SELECT id FROM students WHERE student_number = '2024001'), (SELECT id FROM courses WHERE code = 'MAT101'), (SELECT id FROM semesters WHERE name = '2023-2024 Güz'), 'FF', 'APPROVED');
INSERT INTO enrollments (student_id, course_id, semester_id, grade, status) 
VALUES ((SELECT id FROM students WHERE student_number = '2024001'), (SELECT id FROM courses WHERE code = 'CSE101'), (SELECT id FROM semesters WHERE name = '2023-2024 Güz'), 'BA', 'APPROVED');

-- 10. SINAVLAR
INSERT INTO exams (course_id, semester_id, exam_type, exam_date, classroom_id, ratio) 
VALUES ((SELECT id FROM courses WHERE code = 'CSE201'), (SELECT id FROM semesters WHERE name = '2023-2024 Bahar'), 'MIDTERM', '2026-05-20 10:00:00', (SELECT id FROM classrooms WHERE code = 'A-101'), 40);

-- 11. SOSYAL & ORGANİZASYON
INSERT INTO todo_items (user_id, title, description, completed, due_date) 
VALUES ((SELECT id FROM users WHERE username = '2024001'), 'Ders Kaydını Tamamla', 'Bahar dönemi seçimlerini yapmalısın.', false, '2026-04-30 23:59:00');

INSERT INTO chat_messages (sender_id, receiver_id, content, timestamp, is_read) 
VALUES ((SELECT id FROM users WHERE username = 'hocam01'), (SELECT id FROM users WHERE username = '2024001'), 'Hoş geldin Berat. Akademik planın hakkında konuşabiliriz.', NOW(), false);