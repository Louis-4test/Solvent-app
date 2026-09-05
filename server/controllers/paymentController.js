// server/controllers/paymentController.js
import crypto from 'crypto';
import Payment from '../models/Payment.js';
import User from '../models/User.js';
import { createNotificationForUser } from './notificationController.js';

const generatePaymentRef = () =>
  `PAY-${crypto.randomUUID().replace(/-/g, '').slice(0, 12).toUpperCase()}`;

export const initiatePayment = async (req, res) => {
  try {
    const {
      recipientId,
      amount,
      currency = 'XAF',
      payment_method = 'mobile_money',
      payment_details = {},
      narration = 'Payment'
    } = req.body;

    const userId = req.user.id;

    // Validate input
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Enter a valid amount',
        code: 'INVALID_AMOUNT'
      });
    }

    // If a recipient user is provided, verify they exist
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

    // Create payment record
    const payment = await Payment.create({
      user_id: userId,
      transaction_id: generatePaymentRef(),
      amount,
      currency,
      status: 'completed',
      payment_method,
      payment_details: { ...payment_details, narration, recipientId: recipientId || null }
    });

    await createNotificationForUser(
      userId,
      `Your ${payment_method.replace(/_/g, ' ')} payment of ${currency} ${amount} was successful.`
    );

    res.status(201).json({
      success: true,
      message: `Payment of XAF ${amount} completed successfully`,
      data: payment
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const getPaymentHistory = async (req, res) => {
  try {
    const userId = req.params.userId || req.user.id;

    const payments = await Payment.findAll({
      where: { user_id: userId },
      order: [['created_at', 'DESC']]
    });

    res.status(200).json({
      success: true,
      data: payments
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const getPaymentDetails = async (req, res) => {
  try {
    const { paymentId } = req.params;

    const payment = await Payment.findByPk(paymentId);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    res.status(200).json({
      success: true,
      data: payment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};