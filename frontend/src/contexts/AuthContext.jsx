import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      if (token) {
        try {
          const response = await api.get('/profile');
          setUser(response.data.data.user);
        } catch (error) {
          console.error('Token validation failed:', error);
          localStorage.removeItem('token');
          setToken(null);
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, [token]);

  const login = async (email, password) => {
    try {
      const response = await api.post('/login', { email, password });
      const { user: userData, token: newToken } = response.data.data;
      
      setUser(userData);
      setToken(newToken);
      localStorage.setItem('token', newToken);
      
      return { success: true, user: userData };
    } catch (error) {
      const message = error.response?.data?.error?.message || 'Login failed';
      throw new Error(message);
    }
  };

  const register = async (name, email, password) => {
    try {
      const response = await api.post('/register', { name, email, password });
      const { user: userData, token: newToken } = response.data.data;
      
      setUser(userData);
      setToken(newToken);
      localStorage.setItem('token', newToken);
      
      return { success: true, user: userData };
    } catch (error) {
      const message = error.response?.data?.error?.message || 'Registration failed';
      throw new Error(message);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
  };

  const isAuthenticated = !!user && !!token;
  const isAdmin = user?.role === 'admin';
  const isPatient = user?.role === 'patient';

  const value = {
    user,
    token,
    loading,
    isAuthenticated,
    isAdmin,
    isPatient,
    login,
    register,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
