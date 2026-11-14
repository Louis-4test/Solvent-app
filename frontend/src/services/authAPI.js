import api from './api';

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
    const response = await api.post('/auth/register', userData);
    return validateRegistration(response.data);
  },

  login: async (credentials) => {
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
  },

  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  updateProfile: async (profileData) => {
    const response = await api.put('/auth/me', profileData);
    if (!response.data.success) {
      throw new Error(response.data.error || response.data.message || 'Profile update failed');
    }
    return response.data;
  },

  deleteProfile: async (password) => {
    const response = await api.delete('/auth/me', { data: { password } });
    if (!response.data.success) {
      throw new Error(response.data.error || response.data.message || 'Account deletion failed');
    }
    return response.data;
  },

  uploadAvatar: async (file) => {
    const formData = new FormData();
    formData.append('avatar', file);

    const response = await api.put('/auth/me/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    if (!response.data.success) {
      throw new Error(response.data.error || response.data.message || 'Profile picture upload failed');
    }
    return response.data;
  },

  removeAvatar: async () => {
    const response = await api.delete('/auth/me/avatar');
    if (!response.data.success) {
      throw new Error(response.data.error || response.data.message || 'Profile picture removal failed');
    }
    return response.data;
  },

  sendMFACode: async (email) => {
    const response = await api.post('/auth/send-mfa', { email });
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to send MFA code');
    }
    return response.data;
  },

  verifyMFA: async (email, code) => {
    const response = await api.post('/auth/verify-mfa', { email, code });
    if (!response.data.success) {
      throw new Error(response.data.message || 'MFA verification failed');
    }
    return response.data;
  },

  verifyLoginMFA: async (code, tempToken) => {
    const response = await api.post('/auth/verify-login-mfa', { code, tempToken });

    if (!response.data.success) {
      throw new Error(response.data.error || response.data.message || 'MFA verification failed');
    }

    return response.data;
  },

  forgotPassword: async (email) => {
    const response = await api.post('/auth/forgot-password', { email });
    if (!response.data.success) {
      throw new Error(response.data.message || 'Password reset failed');
    }
    return response.data;
  },

  resetPassword: async (token, newPassword) => {
    const response = await api.post('/auth/reset-password', { token, newPassword });
    if (!response.data.success) {
      throw new Error(response.data.message || 'Password reset failed');
    }
    return response.data;
  },

  changePassword: async (currentPassword, newPassword) => {
    const response = await api.post('/auth/change-password', { currentPassword, newPassword });
    if (!response.data.success) {
      throw new Error(response.data.error || response.data.message || 'Password change failed');
    }
    return response.data;
  }
};