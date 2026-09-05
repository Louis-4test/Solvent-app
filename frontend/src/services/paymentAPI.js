import api from './api';

export const payBill = async ({ amount, service, accountNumber, payment_method = 'mobile_money' }) => {
  const response = await api.post('/payments', {
    amount,
    currency: 'XAF',
    payment_method,
    payment_details: { service, accountNumber }
  });
  return response.data;
};

export const payMerchant = async ({ amount, merchant, payment_method = 'mobile_money' }) => {
  const response = await api.post('/payments', {
    amount,
    currency: 'XAF',
    payment_method,
    payment_details: { merchant, type: 'merchant_payment' }
  });
  return response.data;
};

export const getPaymentHistory = async () => {
  const response = await api.get('/payments/history');
  return response.data;
};

export default {
  payBill,
  payMerchant,
  getPaymentHistory
};