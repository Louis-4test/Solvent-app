import axios from 'axios';

const API_URL = 'http://localhost:3000/api/kyc';

const uploadKYC = async (formData) => {  
  try {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No authentication token found');

    const response = await axios.post(`${API_URL}/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Authorization': `Bearer ${token}`
      },
      timeout: 10000
    });

    return response.data;
  } catch (error) {
    console.error('Upload failed:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
    throw error;
  }
};

export default uploadKYC;