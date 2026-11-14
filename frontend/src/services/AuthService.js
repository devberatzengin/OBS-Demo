import api from './api';

const AuthService = {
  login: async (identifier, password) => {
    const response = await api.post('/auth/login', { identifier, password });
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('obs_user');
    localStorage.removeItem('obs_token');
  }
};

export default AuthService;
