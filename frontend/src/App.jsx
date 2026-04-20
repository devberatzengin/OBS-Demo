import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import StudentDashboard from './pages/StudentDashboard';
import CourseRegistration from './pages/CourseRegistration';
import TranscriptPage from './pages/TranscriptPage';
import WeeklySchedule from './pages/WeeklySchedule';
import ExamCalendar from './pages/ExamCalendar';
import Messages from './pages/Messages';
import ToDoList from './pages/ToDoList';
import Profile from './pages/Profile';
import AttendancePage from './pages/AttendancePage';
import AcademicianDashboard from './pages/AcademicianDashboard';
import CourseDetail from './pages/CourseDetail';
import Advisees from './pages/Advisees';
import CreateCourse from './pages/CreateCourse';
import AcademicianSchedule from './pages/AcademicianSchedule';
import MyStudents from './pages/MyStudents';
import AdminPortal from './pages/AdminPortal';
import AdministrativeDashboard from './pages/AdministrativeDashboard';
import PortalLayout from './layouts/PortalLayout';
import './App.css';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Route */}
          <Route path="/login" element={<LoginPage />} />
          
          {/* Student Routes */}
          <Route path="/student/*" element={
            <ProtectedRoute allowedRoles={['STUDENT']}>
              <PortalLayout>
                <Routes>
                  <Route path="/" element={<StudentDashboard />} />
                  <Route path="/registration" element={<CourseRegistration />} />
                  <Route path="/transcript" element={<TranscriptPage />} />
                  <Route path="/schedule" element={<WeeklySchedule />} />
                  <Route path="/exams" element={<ExamCalendar />} />
                  <Route path="/attendance" element={<AttendancePage />} />
                  <Route path="/messages" element={<Messages />} />
                  <Route path="/todo" element={<ToDoList />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="*" element={<Navigate to="/student" replace />} />
                </Routes>
              </PortalLayout>
            </ProtectedRoute>
          } />

          {/* Academician Routes */}
          <Route path="/academician/*" element={
            <ProtectedRoute allowedRoles={['ACADEMICIAN']}>
              <PortalLayout>
                <Routes>
                  <Route path="/" element={<AcademicianDashboard />} />
                  <Route path="/courses/:courseId" element={<CourseDetail />} />
                  <Route path="/advisees" element={<Advisees />} />
                  <Route path="/create-course" element={<CreateCourse />} />
                  <Route path="/schedule" element={<AcademicianSchedule />} />
                  <Route path="/students" element={<MyStudents />} />
                  <Route path="/messages" element={<Messages />} />
                  <Route path="/todo" element={<ToDoList />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="*" element={<Navigate to="/academician" replace />} />
                </Routes>
              </PortalLayout>
            </ProtectedRoute>
          } />

          {/* Admin Routes (System Admin) */}
          <Route path="/admin/*" element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <PortalLayout>
                <Routes>
                   <Route path="/" element={<AdminPortal />} />
                   <Route path="/users" element={<AdminPortal />} />
                   <Route path="/courses" element={<AdminPortal />} />
                   <Route path="/infra" element={<AdminPortal />} />
                   <Route path="/messages" element={<Messages />} />
                   <Route path="/profile" element={<Profile />} />
                   <Route path="*" element={<Navigate to="/admin" replace />} />
                </Routes>
              </PortalLayout>
            </ProtectedRoute>
          } />

          {/* Administrative Routes (Staff) */}
          <Route path="/administrative/*" element={
            <ProtectedRoute allowedRoles={['ADMINISTRATIVE']}>
              <PortalLayout>
                <Routes>
                   <Route path="/" element={<AdministrativeDashboard />} />
                   <Route path="/messages" element={<Messages />} />
                   <Route path="/profile" element={<Profile />} />
                   <Route path="*" element={<Navigate to="/administrative" replace />} />
                </Routes>
              </PortalLayout>
            </ProtectedRoute>
          } />

          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
