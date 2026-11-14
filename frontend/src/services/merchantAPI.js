import api from './api';

const merchantAPI = {
  listMerchants: async ({ search = '' } = {}) => {
    const response = await api.get('/merchants', { params: { search } });
    return response.data;
  },

  getMerchant: async (code) => {
    const response = await api.get(`/merchants/${encodeURIComponent(code)}`);
    return response.data;
  }
};

export default merchantAPI;
