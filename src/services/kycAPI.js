import axios from 'axios';

const API = axios.create({ baseURL: import.meta.env.VITE_API_URL });

export default {
  upload: (file) => {
    const formData = new FormData();
    formData.append('document', file);
    return API.post('/kyc/verify', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  }
};