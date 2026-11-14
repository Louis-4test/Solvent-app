import api from './api';

const adminAPI = {
  getDashboard: async () => {
    const response = await api.get('/admin/dashboard');
    return response.data;
  },

  getUsers: async ({ page = 1, limit = 10, search = '', role = '', status = '', kyc = '' } = {}) => {
    const response = await api.get('/admin/users', {
      params: { page, limit, search, role, status, kyc }
    });
    return response.data;
  },

  updateUser: async (id, updates) => {
    const response = await api.patch(`/admin/users/${id}`, updates);
    return response.data;
  },

  getTransactions: async ({ page = 1, limit = 10, search = '', status = '', type = '' } = {}) => {
    const response = await api.get('/admin/transactions', {
      params: { page, limit, search, status, type }
    });
    return response.data;
  },

  updateTransactionStatus: async (id, status) => {
    const response = await api.patch(`/admin/transactions/${id}/status`, { status });
    return response.data;
  },

  getPayments: async ({ page = 1, limit = 10, search = '', status = '', method = '' } = {}) => {
    const response = await api.get('/admin/payments', {
      params: { page, limit, search, status, method }
    });
    return response.data;
  },

  getKYC: async ({ page = 1, limit = 10, search = '', status = '' } = {}) => {
    const response = await api.get('/admin/kyc', {
      params: { page, limit, search, status }
    });
    return response.data;
  },

  reviewKYC: async (id, { decision, reason = '' }) => {
    const response = await api.patch(`/admin/kyc/${id}`, { decision, reason });
    return response.data;
  },

  getKYCDocument: async (id, side) => {
    const response = await api.get(`/kyc/submissions/${id}/document/${side}`, {
      responseType: 'blob'
    });
    return response.data;
  }
};

export default adminAPI;
