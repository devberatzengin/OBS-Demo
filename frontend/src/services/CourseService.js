import api from './api';

const CourseService = {
  getAvailableCourses: async () => {
    const response = await api.get('/student/available-courses');
    return response.data;
  },

  registerCourse: async (courseId) => {
    const response = await api.post(`/student/register-course/${courseId}`);
    return response.data;
  },

  getEnrolledCourses: async () => {
    const response = await api.get('/student/enrolled-courses');
    return response.data;
  }
};

export default CourseService;
