import axios from 'axios';

const API_URL = 'http://localhost:3000/api';
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true // If using cookies
});

// Enhanced response interceptor
api.interceptors.response.use(
  response => {
    // Validate successful response structure
    if (!response.data) {
      throw new Error('Invalid server response format');
    }
    return response;
  },
  error => {
    if (error.code === 'ERR_NETWORK') {
      console.error('Network Error - Is the backend server running?');
      throw new Error('Unable to connect to server. Please check your connection.');
    }
    
    // Handle axios errors
    const errorMessage = error.response?.data?.message || 
                        error.message || 
                        'Request failed';
    
    // Convert to standard error format
    const normalizedError = new Error(errorMessage);
    normalizedError.status = error.response?.status;
    normalizedError.data = error.response?.data;
    
    throw normalizedError;
  }
);

// Helper to validate registration response
const validateRegistration = (data) => {
  const responseData = data.data || data;
  
  if (!responseData.token) {
    console.error('Missing token in response:', data);
    throw new Error('Invalid registration response - missing token');
  }

  return {
    token: responseData.token,
    user: responseData.user || {
      id: responseData.id,
      email: responseData.email,
      fullName: responseData.fullName
    }
  };
};

export default {
  register: async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);
      return validateRegistration(response.data);
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  },
  
  sendMFACode: async (email) => {
    try {
      const response = await api.post('/auth/send-mfa', { email });
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to send MFA code');
      }
      return response.data;
    } catch (error) {
      console.error('MFA send error:', error);
      throw error;
    }
  },
  
  verifyMFA: async (email, code) => {
    try {
      const response = await api.post('/auth/verify-mfa', { email, code });
      if (!response.data.success) {
        throw new Error(response.data.message || 'MFA verification failed');
      }
      return response.data;
    } catch (error) {
      console.error('MFA verification error:', error);
      throw error;
    }
  },
  
  login: async (credentials) => {
    try {
      const response = await api.post('/auth/login', credentials);
      
      if (!response.data) {
        throw new Error('Empty server response');
      }
  
      if (!response.data.success) {
        const error = new Error(response.data.message || 'Authentication failed');
        error.code = response.data.code || 'LOGIN_FAILED';
        error.status = response.status;
        throw error;
      }
  
      return response.data;
    } catch (error) {
      // Enhance axios errors
      if (error.response) {
        error.code = error.response.data?.code || 'LOGIN_FAILED';
        error.message = error.response.data?.message || 
                       error.response.data?.error || 
                       error.message;
        error.status = error.response.status;
      }
      
      console.error('Login API error:', {
        code: error.code,
        message: error.message,
        status: error.status,
        responseData: error.response?.data
      });
      
      throw error;
    }
  },

  verifyLoginMFA: async (code, tempToken) => {
    try {
      const response = await api.post('/auth/verify-login-mfa', { code, tempToken });
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'MFA verification failed');
      }

      return response.data;
    } catch (error) {
      console.error('MFA verification error:', error);
      throw error;
    }
  },

  verifyLoginMFA: async (code, tempToken) => {
    try {
      const response = await api.post('/auth/verify-login-mfa', { code, tempToken });
      if (!response.data.success) {
        throw new Error(response.data.message || 'Login verification failed');
      }
      return response.data;
    } catch (error) {
      console.error('Login MFA error:', error);
      throw error;
    }
  },

  forgotPassword: async (email) => {
    try {
      const response = await api.post('/auth/forgot-password', { email });
      if (!response.data.success) {
        throw new Error(response.data.message || 'Password reset failed');
      }
      return response.data;
    } catch (error) {
      console.error('Forgot password error:', error);
      throw error;
    }
  },

  resetPassword: async (token, newPassword) => {
    try {
      const response = await api.post('/auth/reset-password', { token, newPassword });
      if (!response.data.success) {
        throw new Error(response.data.message || 'Password reset failed');
      }
      return response.data;
    } catch (error) {
      console.error('Reset password error:', error);
      throw error;
    }
  }
};