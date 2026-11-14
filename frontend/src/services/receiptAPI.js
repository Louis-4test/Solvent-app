import api from './api';

const receiptAPI = {
  listReceipts: async ({ page = 1, limit = 10, search = '', kind = '', status = '' } = {}) => {
    const response = await api.get('/receipts', {
      params: { page, limit, search, kind, status }
    });
    return response.data;
  },

  getReceipt: async (reference) => {
    const response = await api.get(`/receipts/${encodeURIComponent(reference)}`);
    return response.data;
  }
};

export default receiptAPI;
