import sequelize from '../config/db.js';
import Transaction from '../models/Transaction.js';
import User from '../models/User.js';

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
      type: 'transfer'
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

export const getTransactions = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const transactions = await Transaction.findAll({
      where: {
        [sequelize.Op.or]: [
          { sender_id: userId },
          { recipient_id: userId }
        ]
      },
      order: [['created_at', 'DESC']],
      include: [
        {
          model: User,
          as: 'Sender',
          attributes: ['id', 'name', 'email']
        },
        {
          model: User,
          as: 'Recipient',
          attributes: ['id', 'name', 'email']
        }
      ]
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
      include: [
        {
          model: User,
          as: 'Sender',
          attributes: ['id', 'name', 'email']
        },
        {
          model: User,
          as: 'Recipient',
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    if (!transaction) {
      return res.status(404).json({ 
        success: false,
        message: 'Transaction not found' 
      });
    }

    return res.status(200).json({
      success: true,
      data: transaction
    });
  } catch (error) {
    return res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};