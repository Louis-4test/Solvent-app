import api from './api';

export const transferFunds = async ({ recipientPhone, amount, channel = 'p2p', narration = '' }) => {
  const response = await api.post('/transactions/transfer', {
    recipientPhone,
    amount,
    channel,
    narration
  });
  return response.data;
};

export const getMyTransactions = async () => {
  const response = await api.get('/transactions/me');
  return response.data;
};

export const getTransactionById = async (id) => {
  const response = await api.get(`/transactions/${id}`);
  return response.data;
};

export const getBalance = async () => {
  const response = await api.get('/auth/me');
  return response.data.user;
};

export default {
  transferFunds,
  getMyTransactions,
  getTransactionById,
  getBalance
};