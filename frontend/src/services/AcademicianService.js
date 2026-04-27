import api from './api';

const AcademicianService = {
  getProfile: async () => {
    const response = await api.get('/academician/profile');
    return response.data;
  },

  updateProfile: async (profileData) => {
    const response = await api.put('/academician/profile', profileData);
    return response.data;
  },

  getMyCourses: async () => {
    const response = await api.get('/academician/courses');
    return response.data;
  },

  getCourseStudents: async (courseId) => {
    const response = await api.get(`/academician/courses/${courseId}/students`);
    return response.data;
  },

  getCourseSchedule: async (courseId) => {
    const response = await api.get(`/academician/courses/${courseId}/schedule`);
    return response.data;
  },

  getCourseExams: async (courseId) => {
    const response = await api.get(`/academician/courses/${courseId}/exams`);
    return response.data;
  },

  getAllStudents: async () => {
    const response = await api.get('/academician/all-students');
    return response.data;
  },

  getExamGrades: async (examId) => {
    const response = await api.get(`/academician/exams/${examId}/grades`);
    return response.data;
  },

  getMySchedule: async () => {
    const response = await api.get('/academician/schedule');
    return response.data;
  },

  getAdviseePerformance: async () => {
    const response = await api.get('/academician/advisees/performance');
    return response.data;
  },

  getPendingEnrollments: async () => {
    const response = await api.get('/academician/advisees/enrollments/pending');
    return response.data;
  },

  approveEnrollment: async (enrollmentId) => {
    const response = await api.put(`/academician/enrollments/${enrollmentId}/approve`);
    return response.data;
  },

  rejectEnrollment: async (enrollmentId) => {
    const response = await api.put(`/academician/enrollments/${enrollmentId}/reject`);
    return response.data;
  },

  recordAttendance: async (courseId, data) => {
    const response = await api.post(`/academician/courses/${courseId}/attendance`, data);
    return response.data;
  },

  getTodayAttendance: async (courseId) => {
    const response = await api.get(`/academician/courses/${courseId}/attendance/today`);
    return response.data;
  },

  enterGrades: async (examId, data) => {
    const response = await api.post(`/academician/exams/${examId}/grades`, data);
    return response.data;
  },

  createExam: async (courseId, data) => {
    const response = await api.post(`/academician/courses/${courseId}/exams`, data);
    return response.data;
  },

  updateExam: async (examId, data) => {
    const response = await api.put(`/academician/exams/${examId}`, data);
    return response.data;
  },

  deleteExam: async (examId) => {
    await api.delete(`/academician/exams/${examId}`);
  },

  createCourse: async (data) => {
    const response = await api.post('/academician/courses', data);
    return response.data;
  },

  postAnnouncement: async (courseId, data) => {
    const response = await api.post(`/academician/courses/${courseId}/announcements`, data);
    return response.data;
  }
};

export default AcademicianService;
