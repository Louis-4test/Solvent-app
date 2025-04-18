// server/models/index.js
import User from './User.js';
import Notification from './Notification.js';
import Payment from './Payment.js';
import Transaction from './Transaction.js';

// Set up model associations if needed
User.hasMany(Notification, { foreignKey: 'user_id' });
Notification.belongsTo(User, { foreignKey: 'user_id' });

User.hasMany(Payment, { foreignKey: 'user_id' });
Payment.belongsTo(User, { foreignKey: 'user_id' });

User.hasMany(Transaction, { foreignKey: 'sender_id', as: 'SentTransactions' });
User.hasMany(Transaction, { foreignKey: 'recipient_id', as: 'ReceivedTransactions' });
Transaction.belongsTo(User, { foreignKey: 'sender_id', as: 'Sender' });
Transaction.belongsTo(User, { foreignKey: 'recipient_id', as: 'Recipient' });

export {
  User,
  Notification,
  Payment,
  Transaction
};