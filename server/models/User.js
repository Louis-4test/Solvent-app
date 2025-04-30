import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';
import bcrypt from 'bcrypt';

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  fullName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    index: true 
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: false,
    index: true 
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  isVerified: {  // ← Now properly closed
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  mfaEnabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  mfaCode: {
    type: DataTypes.STRING,
    allowNull: true
  },
  mfaCodeExpires: {
    type: DataTypes.DATE,
    allowNull: true
  },
  kycVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  timestamps: true,
  tableName: 'users',
  hooks: {
    beforeCreate: async (user) => {
      if (user.password) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    }
  }
});

export default User;