import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

export const KYC_DOCUMENT_TYPES = [
  'national_id',
  'passport',
  'drivers_license',
  'voters_card'
];

export const KYC_STATUSES = ['pending', 'under_review', 'approved', 'rejected'];

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
      model: 'users',
      key: 'id'
    },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  },
  document_type: {
    type: DataTypes.ENUM(...KYC_DOCUMENT_TYPES),
    allowNull: false
  },
  document_number: {
    type: DataTypes.STRING(80),
    allowNull: false
  },
  document_front_url: {
    type: DataTypes.STRING(500),
    allowNull: false
  },
  document_back_url: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  selfie_url: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM(...KYC_STATUSES),
    allowNull: false,
    defaultValue: 'pending'
  },
  reviewed_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    },
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE'
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
      name: 'kyc_user_document_index',
      fields: ['user_id', 'document_number']
    },
    {
      name: 'kyc_user_id_index',
      fields: ['user_id']
    },
    {
      name: 'kyc_status_index',
      fields: ['status']
    }
  ]
});

export default KYC;
