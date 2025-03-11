import axios from 'axios';

// Use Vite's environment variable syntax
const API = axios.create({ baseURL: import.meta.env.VITE_API_URL });

export default {
  register: (data) => API.post('/auth/register', data),
  sendMFACode: (email) => API.post('/auth/mfa/send', { email }),
  // Add other auth methods
  verifyMFA: (code) => API.post('/auth/mfa/verify', { code }),
  sendMFACode: () => API.post('/auth/mfa/resend'),
  login: (credentials) => API.post('/auth/login', credentials),
  forgotPassword: (email) => API.post('/auth/forgot-password', { email }),
  resetPassword: (token, newPassword) => API.post('/auth/reset-password', { token, newPassword }),

};
