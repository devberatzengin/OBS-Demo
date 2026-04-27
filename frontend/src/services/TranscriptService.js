import api from './api';

const TranscriptService = {
  getTranscript: async () => {
    const response = await api.get('/student/transcript');
    return response.data;
  }
};

export default TranscriptService;
