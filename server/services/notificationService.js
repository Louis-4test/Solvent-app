const { User, Notification } = require('../models');
const { sendSMS, sendEmail } = require('./thirdPartyServices');

module.exports = {
  createNotification: async (userId, message, type = 'transaction') => {
    return await Notification.create({
      userId,
      message,
      type,
      isRead: false
    });
  },

  sendRealTimeNotification: async (userId, message) => {
    const user = await User.findByPk(userId);
    
    // Send via all channels
    await Promise.all([
      this.createNotification(userId, message),
      user.phone && sendSMS(user.phone, message),
      user.email && sendEmail(user.email, "Solvent Notification", message)
    ]);
  }
};