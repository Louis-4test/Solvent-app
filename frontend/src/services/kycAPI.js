// services/kycAPI.js
import axios from 'axios';

const API_URL = 'http://localhost:3000/api/kyc';

const uploadKYC = async (file) => {
  try {
    if (!file) throw new Error('No file provided');
    
    const formData = new FormData();
    formData.append('idDocument', file);

    const response = await axios.post(`${API_URL}/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      timeout: 10000 // 10 second timeout
    });

    return response.data;
  } catch (error) {
    console.error('Upload failed:', {
      config: error.config,
      response: error.response?.data,
      message: error.message
    });
    throw error;
  }
};

export default { upload: uploadKYC };