import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Merchant = sequelize.define('Merchant', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  code: {
    type: DataTypes.STRING(40),
    allowNull: false,
    unique: true
  },
  name: {
    type: DataTypes.STRING(120),
    allowNull: false
  },
  category: {
    type: DataTypes.STRING(60),
    allowNull: false,
    defaultValue: 'General'
  },
  city: {
    type: DataTypes.STRING(80),
    allowNull: true
  },
  description: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  }
}, {
  tableName: 'merchants',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      unique: true,
      fields: ['code']
    },
    {
      fields: ['is_active']
    }
  ]
});

export default Merchant;
