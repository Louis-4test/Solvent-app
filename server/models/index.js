import User from './User.js';
import Notification from './Notification.js';
import Payment from './Payment.js';
import Transaction from './Transaction.js';
import KYC from './kyc.js';  

// Set up model associations
User.hasMany(Notification, { foreignKey: 'user_id' });
Notification.belongsTo(User, { foreignKey: 'user_id' });

User.hasMany(Payment, { foreignKey: 'user_id' });
Payment.belongsTo(User, { foreignKey: 'user_id' });

User.hasMany(Transaction, { foreignKey: 'sender_id', as: 'SentTransactions' });
User.hasMany(Transaction, { foreignKey: 'recipient_id', as: 'ReceivedTransactions' });
Transaction.belongsTo(User, { foreignKey: 'sender_id', as: 'Sender' });
Transaction.belongsTo(User, { foreignKey: 'recipient_id', as: 'Recipient' });

// Add KYC association
User.hasOne(KYC, { foreignKey: 'userId' });
KYC.belongsTo(User, { foreignKey: 'userId' });

export {
  User,
  Notification,
  Payment,
  Transaction,
  KYC  
};