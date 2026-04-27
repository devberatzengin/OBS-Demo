import api from './api';

const MessagingService = {
  getContacts: async () => {
    const response = await api.get('/messaging/contacts');
    return response.data;
  },

  getChatHistory: async (otherUserId) => {
    const response = await api.get(`/messaging/history/${otherUserId}`);
    return response.data;
  },

  sendMessage: async (receiverId, content) => {
    const response = await api.post('/messaging/send', { receiverId, content });
    return response.data;
  },

  getUnreadCount: async () => {
    const response = await api.get('/messaging/unread');
    return response.data.length;
  }
};

export default MessagingService;
