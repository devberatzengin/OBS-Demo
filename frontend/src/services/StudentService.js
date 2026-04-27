import api from './api';

const StudentService = {
  getDashboardData: async () => {
    const response = await api.get('/student/dashboard');
    return response.data;
  },

  getWeeklySchedule: async () => {
    const response = await api.get('/student/weekly-schedule');
    return response.data;
  },

  getExamCalendar: async () => {
    const response = await api.get('/student/exam-calendar');
    return response.data;
  },

  getProfile: async () => {
    const response = await api.get('/student/profile');
    return response.data;
  },

  updateProfile: async (profileData) => {
    const response = await api.put('/student/profile', profileData);
    return response.data;
  },

  getAttendance: async () => {
    const response = await api.get('/student/attendance');
    return response.data;
  },
};

export default StudentService;
