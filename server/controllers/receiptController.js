import { Op } from 'sequelize';
import Payment from '../models/Payment.js';
import Transaction from '../models/Transaction.js';
import User from '../models/User.js';
import { buildPaymentReceipt, buildTransactionReceipt } from '../utils/receipts.js';

const USER_ATTRIBUTES = ['id', 'fullName', 'email', 'phone', 'avatarUrl'];
const TRANSACTION_USER_INCLUDE = {
  model: User,
  attributes: USER_ATTRIBUTES
};

const receiptDate = (receipt) => {
  const date = new Date(receipt.date || 0);
  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
};

const receiptMatches = (receipt, search) => {
  if (!search) return true;

  const haystack = [
    receipt.reference,
    receipt.title,
    receipt.recipient?.name,
    receipt.narration,
    receipt.methodLabel
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return haystack.includes(search.toLowerCase());
};

export const listReceipts = async (req, res) => {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, Number.parseInt(req.query.limit, 10) || 10));
    const kind = String(req.query.kind || '').trim();
    const status = String(req.query.status || '').trim();
    const search = String(req.query.search || '').trim();

    const [payments, transactions] = await Promise.all([
      kind === 'transfer'
        ? []
        : Payment.findAll({
            where: { user_id: req.user.id },
            order: [['created_at', 'DESC']],
            limit: 500,
            include: [{ model: User, attributes: USER_ATTRIBUTES }]
          }),
      kind === 'payment'
        ? []
        : Transaction.findAll({
            where: {
              [Op.or]: [
                { sender_id: req.user.id },
                { recipient_id: req.user.id }
              ]
            },
            order: [['created_at', 'DESC']],
            limit: 500,
            include: [
              { ...TRANSACTION_USER_INCLUDE, as: 'Sender' },
              { ...TRANSACTION_USER_INCLUDE, as: 'Recipient' }
            ]
          })
    ]);

    let receipts = [
      ...payments.map((payment) => buildPaymentReceipt(payment)),
      ...transactions.map((transaction) => buildTransactionReceipt(transaction))
    ];

    if (status) {
      receipts = receipts.filter((receipt) => receipt.status === status);
    }

    receipts = receipts
      .filter((receipt) => receiptMatches(receipt, search))
      .sort((a, b) => receiptDate(b) - receiptDate(a));

    const total = receipts.length;
    const offset = (page - 1) * limit;

    return res.json({
      success: true,
      data: receipts.slice(offset, offset + limit),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit))
      }
    });
  } catch (error) {
    console.error('List receipts error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to load receipts',
      code: 'RECEIPTS_FAILED'
    });
  }
};

export const getReceipt = async (req, res) => {
  try {
    const reference = String(req.params.reference || '').trim();
    const canViewOthers = req.user.isAdmin;

    const payment = await Payment.findOne({
      where: { transaction_id: reference },
      include: [{ model: User, attributes: USER_ATTRIBUTES }]
    });

    if (payment) {
      if (payment.user_id !== req.user.id && !canViewOthers) {
        return res.status(404).json({
          success: false,
          error: 'Receipt not found',
          code: 'RECEIPT_NOT_FOUND'
        });
      }

      return res.json({
        success: true,
        data: buildPaymentReceipt(payment)
      });
    }

    const transaction = await Transaction.findOne({
      where: { reference },
      include: [
        { ...TRANSACTION_USER_INCLUDE, as: 'Sender' },
        { ...TRANSACTION_USER_INCLUDE, as: 'Recipient' }
      ]
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        error: 'Receipt not found',
        code: 'RECEIPT_NOT_FOUND'
      });
    }

    const isParticipant =
      transaction.sender_id === req.user.id || transaction.recipient_id === req.user.id;

    if (!isParticipant && !canViewOthers) {
      return res.status(404).json({
        success: false,
        error: 'Receipt not found',
        code: 'RECEIPT_NOT_FOUND'
      });
    }

    return res.json({
      success: true,
      data: buildTransactionReceipt(transaction)
    });
  } catch (error) {
    console.error('Get receipt error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to load receipt',
      code: 'RECEIPT_LOOKUP_FAILED'
    });
  }
};

export default {
  listReceipts,
  getReceipt
};
