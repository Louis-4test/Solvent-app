const { BillPayment, MerchantPayment } = require('../models');

exports.processBillPayment = async (req, res) => {
  try {
    const { biller, accountNumber, amount } = req.body;
    
    // Validate sufficient balance
    const user = await User.findByPk(req.user.id);
    if (user.balance < amount) {
      return res.status(400).json({ error: "Insufficient balance" });
    }

    // MySQL transaction
    const t = await sequelize.transaction();
    
    try {
      const payment = await BillPayment.create({
        userId: user.id,
        biller,
        accountNumber,
        amount,
        status: 'completed'
      }, { transaction: t });

      await user.decrement('balance', { by: amount, transaction: t });
      await t.commit();
      
      res.json(payment);
    } catch (err) {
      await t.rollback();
      throw err;
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};