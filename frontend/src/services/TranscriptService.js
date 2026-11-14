import api from './api';

const TranscriptService = {
  getTranscript: async () => {
    const response = await api.get('/student/transcript');
    return response.data;
  },

  // hypotheticalGrades: { [courseCode]: 'AA' | 'BA' | ... } → projected cumulative GPA
  simulateGpa: async (hypotheticalGrades) => {
    const response = await api.post('/student/simulate-gpa', { hypotheticalGrades });
    return response.data;
  },
};

export default TranscriptService;
