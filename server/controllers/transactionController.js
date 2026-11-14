import sequelize from '../config/db.js';
import crypto from 'crypto';
import { Op } from 'sequelize';
import Transaction from '../models/Transaction.js';
import User from '../models/User.js';
import { createNotificationForUser } from './notificationController.js';
import { buildTransactionReceipt } from '../utils/receipts.js';

const SAFE_USER_ATTRS = ['id', 'fullName', 'email', 'phone'];

const userSummaryInclude = (as) => ({
  model: User,
  as,
  attributes: SAFE_USER_ATTRS
});

export const createTransaction = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { senderId, recipientId, amount, narration = 'Fund transfer' } = req.body;

    // Validate input
    if (!senderId || !recipientId || !amount || amount <= 0) {
      await t.rollback();
      return res.status(400).json({ 
        success: false,
        message: 'Invalid transaction details' 
      });
    }

    // Check if users exist
    const [sender, recipient] = await Promise.all([
      User.findByPk(senderId, { transaction: t }),
      User.findByPk(recipientId, { transaction: t })
    ]);

    if (!sender || !recipient) {
      await t.rollback();
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }

    // Create transaction
    const transaction = await Transaction.create({
      sender_id: senderId,
      recipient_id: recipientId,
      amount,
      narration,
      status: 'pending',
      type: 'transfer',
      reference: `TXN-${crypto.randomUUID().replace(/-/g, '').slice(0, 12).toUpperCase()}`
    }, { transaction: t });

    // Complete transaction (simulated)
    transaction.status = 'completed';
    await transaction.save({ transaction: t });

    await t.commit();
    
    return res.status(201).json({
      success: true,
      data: transaction
    });

  } catch (error) {
    await t.rollback();
    return res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};

export const transferFunds = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { recipientPhone, amount, channel = 'p2p', narration } = req.body;
    const senderId = req.user.id;

    if (!recipientPhone) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: 'Recipient phone number is required',
        code: 'MISSING_RECIPIENT'
      });
    }

    if (!amount || amount <= 0) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: 'Enter a valid amount',
        code: 'INVALID_AMOUNT'
      });
    }

    const recipient = await User.findOne({ where: { phone: recipientPhone } });
    if (!recipient) {
      await t.rollback();
      return res.status(404).json({
        success: false,
        message: `No Solvent account found for ${recipientPhone}`,
        code: 'RECIPIENT_NOT_FOUND'
      });
    }

    if (recipient.id === senderId) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: 'You cannot transfer money to yourself',
        code: 'SELF_TRANSFER'
      });
    }

    const transaction = await Transaction.create({
      sender_id: senderId,
      recipient_id: recipient.id,
      amount,
      narration: narration || `Transfer via ${channel}`,
      status: 'completed',
      type: 'transfer',
      reference: `TXN-${crypto.randomUUID().replace(/-/g, '').slice(0, 12).toUpperCase()}`
    }, { transaction: t });

    await t.commit();

    await Promise.all([
      createNotificationForUser(senderId, `You sent XAF ${amount} to ${recipient.fullName}.`),
      createNotificationForUser(recipient.id, `You received XAF ${amount} via Solvent.`)
    ]);

    const created = await Transaction.findByPk(transaction.id, {
      include: [userSummaryInclude('Sender'), userSummaryInclude('Recipient')]
    });

    return res.status(201).json({
      success: true,
      message: `Successfully transferred XAF ${amount} to ${recipient.fullName}`,
      data: {
        ...created.toJSON(),
        receipt: created ? buildTransactionReceipt(created) : null
      }
    });

  } catch (error) {
    await t.rollback();
    return res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};

export const getMyTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.findAll({
      where: {
        [Op.or]: [
          { sender_id: req.user.id },
          { recipient_id: req.user.id }
        ]
      },
      order: [['created_at', 'DESC']],
      limit: 10,
      include: [userSummaryInclude('Sender'), userSummaryInclude('Recipient')]
    });

    return res.status(200).json({
      success: true,
      data: transactions
    });
  } catch (error) {
    return res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};

export const getTransactions = async (req, res) => {
  try {
    const requestedUserId = Number.parseInt(req.params.userId, 10);

    if (!Number.isInteger(requestedUserId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user id'
      });
    }

    if (requestedUserId !== req.user.id && !req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view these transactions'
      });
    }

    const transactions = await Transaction.findAll({
      where: {
        [Op.or]: [
          { sender_id: requestedUserId },
          { recipient_id: requestedUserId }
        ]
      },
      order: [['created_at', 'DESC']],
      include: [userSummaryInclude('Sender'), userSummaryInclude('Recipient')]
    });

    return res.status(200).json({
      success: true,
      data: transactions
    });
  } catch (error) {
    return res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};

export const getTransactionById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const transaction = await Transaction.findByPk(id, {
      include: [userSummaryInclude('Sender'), userSummaryInclude('Recipient')]
    });

    if (!transaction) {
      return res.status(404).json({ 
        success: false,
        message: 'Transaction not found' 
      });
    }

    const isParticipant =
      transaction.sender_id === req.user.id || transaction.recipient_id === req.user.id;

    if (!isParticipant && !req.user.isAdmin) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        ...transaction.toJSON(),
        receipt: buildTransactionReceipt(transaction)
      }
    });
  } catch (error) {
    return res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};