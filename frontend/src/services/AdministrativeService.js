import api from './api';

const clean = (params = {}) => Object.fromEntries(
  Object.entries(params).filter(([, v]) => v !== '' && v !== null && v !== undefined),
);

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
  // Paged, newest first: { content, page, size, totalElements, totalPages }
  getLogs: async ({ page = 0, size = 10 } = {}) => {
    const response = await api.get('/admin/operations/logs', { params: { page, size } });
    return response.data;
  },
  sendAnnouncement: async (data) => {
    const response = await api.post('/admin/operations/announcement', data);
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
  // Paged lists. params: { page, size, q, departmentId }; empty values are left out
  getStudents: async (params) => {
    const response = await api.get('/admin/users/students', { params: clean(params) });
    return response.data;
  },
  getAcademicians: async (params) => {
    const response = await api.get('/admin/users/academicians', { params: clean(params) });
    return response.data;
  },
  getAdministratives: async (params) => {
    const response = await api.get('/admin/users/administrative', { params: clean(params) });
    return response.data;
  },
  // [{ id, name, departmentId }] for the advisor and instructor pickers
  getAcademicianOptions: async () => {
    const response = await api.get('/admin/users/academicians/options');
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
  // Soft delete on the backend: the account is deactivated, its history kept
  deleteUser: async (id) => {
    const response = await api.delete(`/admin/users/${id}`);
    return response.data;
  },
  reactivateUser: async (id) => {
    const response = await api.patch(`/admin/users/${id}/reactivate`);
    return response.data;
  },

  // Course Management
  getCourses: async (params) => {
    const response = await api.get('/admin/academics/courses', { params: clean(params) });
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
