import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Transaction = sequelize.define('Transaction', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  sender_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  recipient_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  amount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false
  },
  narration: {
    type: DataTypes.STRING,
    defaultValue: 'Fund transfer'
  },
  status: {
    type: DataTypes.ENUM(
      'pending',
      'completed',
      'failed',
      'reversed'
    ),
    defaultValue: 'pending'
  },
  type: {
    type: DataTypes.ENUM(
      'transfer',
      'deposit',
      'withdrawal',
      'payment'
    ),
    allowNull: false
  },
  reference: {
    type: DataTypes.STRING,
    unique: true
  }
}, {
  tableName: 'transactions',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

export default Transaction;