// server/controllers/paymentController.js
import Payment from '../models/Payment.js';
import User from '../models/User.js';

export const initiatePayment = async (req, res) => {
  try {
    const { senderId, recipientId, amount, currency = 'XAF' } = req.body;

    // Validate input
    if (!senderId || !recipientId || !amount) {
      return res.status(400).json({ 
        success: false,
        message: 'Missing required fields' 
      });
    }

    // Check if users exist
    const sender = await User.findByPk(senderId);
    const recipient = await User.findByPk(recipientId);

    if (!sender || !recipient) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }

    // Create payment record
    const payment = await Payment.create({
      user_id: senderId,
      recipient_id: recipientId,
      amount,
      currency,
      status: 'pending'
    });

    // Process payment (would integrate with payment gateway in production)
    // This is just a simulation
    payment.status = 'completed';
    await payment.save();

    res.status(201).json({
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

export const getPaymentHistory = async (req, res) => {
  try {
    const { userId } = req.params;
    
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