import api from './api';

export default {
  uploadKYC: async (formData) => {
    const response = await api.post('/kyc/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      timeout: 10000
    });

    return response.data;
  },

  getKYCStatus: async () => {
    const response = await api.get('/kyc/status');
    return response.data;
  }
};