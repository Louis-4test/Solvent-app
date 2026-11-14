import crypto from 'crypto';
import { Op } from 'sequelize';
import Payment from '../models/Payment.js';
import User from '../models/User.js';
import Merchant from '../models/Merchant.js';
import { createNotificationForUser } from './notificationController.js';
import {
  buildMerchantQrPayload,
  normalizeMerchantCode,
  parseMerchantQrPayload
} from '../utils/merchantQr.js';
import { buildPaymentReceipt } from '../utils/receipts.js';

const PAYMENT_METHODS = ['card', 'bank_transfer', 'mobile_money', 'crypto'];
const USER_ATTRIBUTES = ['id', 'fullName', 'email', 'phone', 'avatarUrl'];

const generatePaymentRef = () =>
  `PAY-${crypto.randomUUID().replace(/-/g, '').slice(0, 12).toUpperCase()}`;

const normalizeAmount = (value) => {
  const amount = Number.parseFloat(value);

  if (!Number.isFinite(amount) || amount <= 0) return null;

  return Math.round(amount * 100) / 100;
};

const normalizeCurrency = (value) => {
  const currency = String(value || 'XAF').trim().toUpperCase();
  return /^[A-Z]{3}$/.test(currency) ? currency : 'XAF';
};

const normalizeMethod = (value) => {
  const method = String(value || 'mobile_money').trim();
  return PAYMENT_METHODS.includes(method) ? method : null;
};

const paymentSummary = (payment) => {
  const receipt = buildPaymentReceipt(payment);

  return {
    ...payment.toJSON(),
    receipt
  };
};

const loadPayment = (id) =>
  Payment.findByPk(id, {
    include: [{ model: User, attributes: USER_ATTRIBUTES }]
  });

const createPaymentRecord = async ({
  userId,
  amount,
  currency,
  method,
  paymentDetails,
  notificationMessage
}) => {
  const payment = await Payment.create({
    user_id: userId,
    transaction_id: generatePaymentRef(),
    amount,
    currency,
    status: 'completed',
    payment_method: method,
    payment_details: paymentDetails
  });

  const hydrated = await loadPayment(payment.id);

  await createNotificationForUser(userId, notificationMessage);

  return hydrated || payment;
};

export const initiatePayment = async (req, res) => {
  try {
    const {
      recipientId,
      amount: rawAmount,
      currency = 'XAF',
      payment_method,
      paymentMethod,
      payment_details = {},
      narration = 'Payment'
    } = req.body;

    const amount = normalizeAmount(rawAmount);
    const method = normalizeMethod(payment_method || paymentMethod);

    if (!amount) {
      return res.status(400).json({
        success: false,
        message: 'Enter a valid amount',
        code: 'INVALID_AMOUNT'
      });
    }

    if (!method) {
      return res.status(400).json({
        success: false,
        message: 'Choose a supported payment method',
        code: 'INVALID_PAYMENT_METHOD'
      });
    }

    if (recipientId) {
      const recipient = await User.findByPk(recipientId);
      if (!recipient) {
        return res.status(404).json({
          success: false,
          message: 'Recipient not found',
          code: 'RECIPIENT_NOT_FOUND'
        });
      }
    }

    const details =
      payment_details && typeof payment_details === 'object' ? { ...payment_details } : {};

    if (details.service && !details.type) {
      details.type = 'bill_payment';
    }
    if (details.merchant && !details.type) {
      details.type = 'merchant_payment';
    }

    const payment = await createPaymentRecord({
      userId: req.user.id,
      amount,
      currency: normalizeCurrency(currency),
      method,
      paymentDetails: {
        ...details,
        narration,
        recipientId: recipientId || null
      },
      notificationMessage: `Your ${method.replace(/_/g, ' ')} payment of ${normalizeCurrency(
        currency
      )} ${amount.toLocaleString()} was successful.`
    });

    return res.status(201).json({
      success: true,
      message: `Payment of ${normalizeCurrency(currency)} ${amount.toLocaleString()} completed successfully`,
      data: paymentSummary(payment)
    });
  } catch (error) {
    console.error('Initiate payment error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const payWithQR = async (req, res) => {
  try {
    const {
      qrPayload,
      qrCode,
      qr,
      merchantCode,
      amount: rawAmount,
      currency = 'XAF',
      payment_method,
      paymentMethod,
      note = ''
    } = req.body;

    const rawPayload = qrPayload || qrCode || qr || merchantCode;
    const code = parseMerchantQrPayload(rawPayload);
    const amount = normalizeAmount(rawAmount);
    const method = normalizeMethod(payment_method || paymentMethod);

    if (!code) {
      return res.status(400).json({
        success: false,
        message: 'Scan a valid Solvent merchant QR code or enter the merchant code',
        code: 'INVALID_QR_PAYLOAD'
      });
    }

    if (!amount) {
      return res.status(400).json({
        success: false,
        message: 'Enter a valid amount',
        code: 'INVALID_AMOUNT'
      });
    }

    if (!method) {
      return res.status(400).json({
        success: false,
        message: 'Choose a supported payment method',
        code: 'INVALID_PAYMENT_METHOD'
      });
    }

    const merchant = await Merchant.findOne({
      where: {
        code: normalizeMerchantCode(code),
        is_active: true
      }
    });

    if (!merchant) {
      return res.status(404).json({
        success: false,
        message: 'This merchant QR code is invalid or no longer active',
        code: 'MERCHANT_NOT_FOUND'
      });
    }

    const normalizedCurrency = normalizeCurrency(currency);
    const payment = await createPaymentRecord({
      userId: req.user.id,
      amount,
      currency: normalizedCurrency,
      method,
      paymentDetails: {
        type: 'merchant_qr',
        merchant: {
          id: merchant.id,
          code: merchant.code,
          name: merchant.name,
          category: merchant.category,
          city: merchant.city,
          description: merchant.description
        },
        merchantCode: merchant.code,
        merchantName: merchant.name,
        note: String(note || '').slice(0, 280),
        qrPayload: buildMerchantQrPayload(merchant)
      },
      notificationMessage: `Your QR payment of ${normalizedCurrency} ${amount.toLocaleString()} to ${merchant.name} was successful.`
    });

    return res.status(201).json({
      success: true,
      message: `Paid ${normalizedCurrency} ${amount.toLocaleString()} to ${merchant.name}`,
      data: paymentSummary(payment)
    });
  } catch (error) {
    console.error('QR payment error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const getPaymentHistory = async (req, res) => {
  try {
    const requestedUserId = req.params.userId
      ? Number.parseInt(req.params.userId, 10)
      : req.user.id;

    if (!Number.isInteger(requestedUserId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid user id'
      });
    }

    if (requestedUserId !== req.user.id && !req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to view these payments'
      });
    }

    const payments = await Payment.findAll({
      where: { user_id: requestedUserId },
      order: [['created_at', 'DESC']],
      include: [{ model: User, attributes: USER_ATTRIBUTES }]
    });

    return res.status(200).json({
      success: true,
      data: payments.map(paymentSummary)
    });
  } catch (error) {
    console.error('Payment history error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

const findAccessiblePayment = async (paymentId, user) => {
  const numericId = Number.parseInt(paymentId, 10);
  const where = Number.isInteger(numericId)
    ? { id: numericId }
    : { transaction_id: String(paymentId) };
  const payment = await Payment.findOne({
    where,
    include: [{ model: User, attributes: USER_ATTRIBUTES }]
  });

  if (!payment) return null;

  if (payment.user_id !== user.id && !user.isAdmin) return null;

  return payment;
};

export const getPaymentDetails = async (req, res) => {
  try {
    const payment = await findAccessiblePayment(req.params.paymentId, req.user);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: paymentSummary(payment)
    });
  } catch (error) {
    console.error('Payment details error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const searchUserPayments = async (req, res) => {
  try {
    const search = String(req.query.search || '').trim();
    const conditions = [{ user_id: req.user.id }];

    if (search) {
      const pattern = `%${search}%`;
      conditions.push({
        [Op.or]: [
          { transaction_id: { [Op.like]: pattern } },
          { payment_method: { [Op.like]: pattern } }
        ]
      });
    }

    const payments = await Payment.findAll({
      where: { [Op.and]: conditions },
      order: [['created_at', 'DESC']],
      limit: 100,
      include: [{ model: User, attributes: USER_ATTRIBUTES }]
    });

    return res.json({
      success: true,
      data: payments.map(paymentSummary)
    });
  } catch (error) {
    console.error('Search payments error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to search payments',
      code: 'PAYMENT_SEARCH_FAILED'
    });
  }
};

export default {
  initiatePayment,
  payWithQR,
  getPaymentHistory,
  getPaymentDetails,
  searchUserPayments
};
