-- Empties every application table so a fixture can be loaded into a known state.
TRUNCATE TABLE
    attendance_records, grades, enrollments, exams, schedules, announcements,
    office_hours, notifications, chat_messages, todo_items, system_logs,
    courses, classrooms, semesters,
    students, academicians, administratives, users,
    departments, faculties
RESTART IDENTITY CASCADE;
