import { createContext, useState, useContext } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  // Restore the session synchronously so protected routes don't redirect on first render
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('obs_user');
      return savedUser && localStorage.getItem('obs_token') ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });
  const loading = false;

  const login = (userData, token) => {
    localStorage.setItem('obs_user', JSON.stringify(userData));
    localStorage.setItem('obs_token', token);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('obs_user');
    localStorage.removeItem('obs_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);
