import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';
import User from './User.js';

const Notification = sequelize.define('Notification', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  message: {
    type: DataTypes.STRING,
    allowNull: false
  },
  is_read: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  tableName: 'notifications',
  createdAt: 'created_at',
  updatedAt: false
});

// ✅ Define association
Notification.belongsTo(User, {
  foreignKey: {
    name: 'user_id',
    allowNull: false
  },
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
});

export default Notification;
