// server/models/KYC.js
import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const KYC = sequelize.define('KYC', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  document_type: {
    type: DataTypes.ENUM(
      'national_id',
      'passport',
      'drivers_license',
      'voters_card'
    ),
    allowNull: false
  },
  document_number: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  document_front_url: {
    type: DataTypes.STRING,
    allowNull: false
  },
  document_back_url: {
    type: DataTypes.STRING,
    allowNull: true // Not all documents need back photos
  },
  selfie_url: {
    type: DataTypes.STRING,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM(
      'pending',
      'under_review',
      'approved',
      'rejected'
    ),
    defaultValue: 'pending'
  },
  reviewed_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  rejection_reason: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  verified_at: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'kyc_verifications',
  timestamps: true,
  createdAt: 'submitted_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      unique: true,
      fields: ['document_number']
    },
    {
      fields: ['user_id']
    },
    {
      fields: ['status']
    }
  ]
});

export default KYC;