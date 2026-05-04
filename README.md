# 🎓 OBS — Academic Management Portal

<div align="center">

![Java](https://img.shields.io/badge/Java-17-orange?style=for-the-badge&logo=openjdk)
![Spring Boot](https://img.shields.io/badge/Spring_Boot-3.x-brightgreen?style=for-the-badge&logo=springboot)
![React](https://img.shields.io/badge/React-18-blue?style=for-the-badge&logo=react)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?style=for-the-badge&logo=postgresql)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=for-the-badge&logo=docker)

**A full-stack, role-based Academic Information System built with Spring Boot & React.**

</div>

---

## 📋 Overview

OBS (Öğrenci Bilgi Sistemi) is a modern, full-stack **Student Information System** designed to manage all aspects of university operations — from student enrollment and grade tracking to academician management and administrative oversight.

The system supports four distinct user roles, each with a dedicated portal and tailored feature set.

---

## ✨ Features

### 🔴 Root Admin Portal
- System-wide dashboard with real-time statistics (students, staff, courses)
- Full CRUD for users: Students, Academicians, Administrative Staff
- Department-based course management with instructor assignment
- Role-colored personnel directory (Students: Green, Academicians: Purple, Staff: Orange)
- Live **System Activity Feed** — audit log of all critical actions
- Global announcement broadcasting

### 🟣 Academician Portal
- Personal dashboard with assigned courses and student lists
- Grade entry and approval workflow
- Attendance tracking per course
- Office hours management
- Advisee performance monitoring
- Exam scheduling

### 🟢 Student Portal
- Dashboard with enrolled courses, GPA, and upcoming exams
- Course registration system with prerequisite validation
- Weekly schedule view
- Full transcript with semester-by-semester GPA
- Grade simulation tool
- To-Do list and notification center

### 🟡 Administrative Staff Portal
- Department-scoped dashboard and reporting
- Student and course management within assigned unit

### 💬 Shared Features
- Real-time messaging system between all roles
- JWT-based authentication & role-based access control
- Glassmorphism dark-mode UI

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Backend** | Java 17, Spring Boot 3, Spring Security, JPA/Hibernate |
| **Database** | PostgreSQL 16 |
| **Auth** | JWT (JSON Web Token) |
| **Frontend** | React 18, Vite, Lucide React |
| **Styling** | CSS (Glassmorphism Dark Theme) |
| **DevOps** | Docker, Docker Compose |

---

## 🗂️ Project Structure

```
OBS/
├── backend/                  # Spring Boot application
│   └── src/main/java/com/obs/backend/
│       ├── controller/       # REST API endpoints
│       ├── service/          # Business logic layer
│       ├── model/            # JPA entities
│       ├── repository/       # Spring Data repositories
│       ├── dto/              # Data Transfer Objects
│       ├── security/         # JWT & Spring Security config
│       └── exception/        # Global error handling
├── frontend/                 # React application
│   └── src/
│       ├── pages/            # Role-based page components
│       ├── services/         # Axios API service layer
│       ├── components/       # Shared UI components
│       ├── context/          # Auth context & state
│       └── layouts/          # Portal layout wrappers
├── docker-compose.yml
└── seed.sql                  # Initial database seed data
```

---

## 🚀 Getting Started

### Prerequisites
- Java 17+
- Node.js 18+
- PostgreSQL 16 (or Docker)

### 1. Clone the repository
```bash
git clone https://github.com/devberatzengin/OBS-Demo.git
cd OBS-Demo
```

### 2. Start the database (via Docker)
```bash
docker-compose up -d
```

### 3. Run the Backend
```bash
cd backend
./gradlew bootRun
```
> API will be available at `http://localhost:8080`

### 4. Run the Frontend
```bash
cd frontend
npm install
npm run dev
```
> App will be available at `http://localhost:5173`

---

## 🔑 Default Credentials (Seed Data)

| Role | Username | Password |
|------|----------|----------|
| Root Admin | `sysadmin` | `admin123` |
| Academician | `prof.smith` | `123456` |
| Student | `student01` | `123456` |

> ⚠️ Change these credentials before any production deployment.

---

## 📸 Screenshots

> Login Page · Admin Dashboard · Student Portal · Academician Grade Entry

*(Add screenshots here)*

---

## 🛡️ Architecture

```
Client (React + Vite)
    │
    │  HTTP / REST
    ▼
Spring Boot API (Port 8080)
    │  Spring Security + JWT Filter
    │
    ├── Controllers (AuthController, AdminUserController, StudentController...)
    ├── Services (AdminServiceImpl, StudentServiceImpl, TranscriptServiceImpl...)
    ├── Repositories (JPA / Spring Data)
    │
    ▼
PostgreSQL Database
```

---

## 📄 License

This project is intended for academic and portfolio purposes.

---

<div align="center">
Made with ☕ and 💻 — <a href="https://github.com/devberatzengin">@devberatzengin</a>
</div>
