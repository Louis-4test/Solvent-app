import axios from 'axios';

const API_URL = 'http://localhost:3000/api';
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true // If using cookies
});

// Add response interceptor for error handling
api.interceptors.response.use(
  response => response,
  error => {
    if (error.code === 'ERR_NETWORK') {
      console.error('Network Error - Is the backend server running?');
    }
    return Promise.reject(error);
  }
);

export default {
  register: async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);
      return response.data;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  },
  
  sendMFACode: async (email) => {
    const response = await api.post('/auth/send-mfa', { email });
    return response.data;
  },
  
  verifyMFA: async (email, code) => {
    const response = await api.post('/auth/verify-mfa', { email, code });
    return response.data;
  },
  
  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  verifyLoginMFA: async (code, tempToken) => {
    const response = await api.post('/auth/verify-login-mfa', { code, tempToken });
    return response.data;
  },

  // Add other auth methods as needed
  forgotPassword: async (email) => {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },

  resetPassword: async (token, newPassword) => {
    const response = await api.post('/auth/reset-password', { token, newPassword });
    return response.data;
  }
};