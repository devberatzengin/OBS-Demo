import api from './api';

const AdministrativeService = {
  // Infrastructure
  getFaculties: async () => {
    const response = await api.get('/admin/infrastructure/faculties');
    return response.data;
  },
  getDepartments: async () => {
    const response = await api.get('/admin/infrastructure/departments');
    return response.data;
  },

  // Academic Cycle
  getSemesters: async () => {
    const response = await api.get('/admin/academics/semesters');
    return response.data;
  },
  createSemester: async (semesterData) => {
    const response = await api.post('/admin/academics/semesters', semesterData);
    return response.data;
  },
  updateSemester: async (id, semesterData) => {
    const response = await api.put(`/admin/academics/semesters/${id}`, semesterData);
    return response.data;
  },
  activateSemester: async (id) => {
    const response = await api.patch(`/admin/academics/semesters/${id}/activate`);
    return response.data;
  },

  // Stats (Optional if you want real stats)
  getStats: async () => {
    const response = await api.get('/admin/operations/stats');
    return response.data;
  },
  getLogs: async () => {
    const response = await api.get('/admin/operations/logs');
    return response.data;
  },
  // Profile
  getProfile: async () => {
    const response = await api.get('/admin/users/profile');
    return response.data;
  },
  updateProfile: async (profileData) => {
    const response = await api.put('/admin/users/profile', profileData);
    return response.data;
  },

  // User Management
  registerStudent: async (data) => {
    const response = await api.post('/admin/users/students', data);
    return response.data;
  },
  registerAcademician: async (data) => {
    const response = await api.post('/admin/users/academicians', data);
    return response.data;
  },
  registerAdministrative: async (data) => {
    const response = await api.post('/admin/users/administrative', data);
    return response.data;
  },
  getAllStudents: async () => {
    const response = await api.get('/admin/users/students');
    return response.data;
  },
  getAllAcademicians: async () => {
    const response = await api.get('/admin/users/academicians');
    return response.data;
  },
  getAllAdministratives: async () => {
    const response = await api.get('/admin/users/administrative');
    return response.data;
  },
  updateStudent: async (id, data) => {
    const response = await api.put(`/admin/users/students/${id}`, data);
    return response.data;
  },
  updateAcademician: async (id, data) => {
    const response = await api.put(`/admin/users/academicians/${id}`, data);
    return response.data;
  },
  updateAdministrative: async (id, data) => {
    const response = await api.put(`/admin/users/administrative/${id}`, data);
    return response.data;
  },
  deleteUser: async (id) => {
    const response = await api.delete(`/admin/users/${id}`);
    return response.data;
  },

  // Course Management
  getAllCourses: async () => {
    const response = await api.get('/admin/academics/courses');
    return response.data;
  },
  createCourse: async (data) => {
    const response = await api.post('/admin/academics/courses', data);
    return response.data;
  },
  updateCourse: async (id, data) => {
    const response = await api.put(`/admin/academics/courses/${id}`, data);
    return response.data;
  },
  deleteCourse: async (id) => {
    const response = await api.delete(`/admin/academics/courses/${id}`);
    return response.data;
  },
  assignInstructor: async (courseId, instructorId) => {
    const response = await api.post(`/admin/academics/courses/${courseId}/assign-instructor/${instructorId}`);
    return response.data;
  }
};

export default AdministrativeService;
