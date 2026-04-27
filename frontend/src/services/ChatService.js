import api from './api';

const ChatService = {
    getConversations: async () => {
        const response = await api.get('/chat/conversations');
        return response.data;
    },

    getMessages: async (userId) => {
        const response = await api.get(`/chat/messages/${userId}`);
        return response.data;
    },

    sendMessage: async (receiverId, content) => {
        const response = await api.post('/chat/send', { receiverId, content });
        return response.data;
    },

    searchUsers: async (query) => {
        const response = await api.get(`/chat/search?query=${query}`);
        return response.data;
    }
};

export default ChatService;
