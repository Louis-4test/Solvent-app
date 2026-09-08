import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true
});

// Attach auth token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Normalize errors for consistent handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === 'ERR_NETWORK') {
      console.error('Network Error - Is the backend server running?');
      throw new Error('Unable to connect to server. Please check your connection.');
    }

    const errorMessage =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      'Request failed';

    const normalizedError = new Error(errorMessage);
    normalizedError.status = error.response?.status;
    normalizedError.code = error.response?.data?.code || 'REQUEST_FAILED';
    normalizedError.data = error.response?.data;

    throw normalizedError;
  }
);

export default api;
export { API_URL };