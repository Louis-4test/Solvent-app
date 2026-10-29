import sequelize from '../../config/db.js';
import { Notification, Payment, Transaction, User } from '../../models/index.js';

if (process.env.NODE_ENV === 'production') {
  throw new Error('Demo seed data must not be loaded in production.');
}

const demoUsers = [
  {
    fullName: 'Alex Demo',
    email: 'alex.demo@example.test',
    phone: '+237600000101',
    password: 'DemoPass123!',
    isVerified: true,
    isAdmin: false
  },
  {
    fullName: 'Sam Demo',
    email: 'sam.demo@example.test',
    phone: '+237600000102',
    password: 'DemoPass123!',
    isVerified: true,
    isAdmin: false
  },
  {
    fullName: 'Taylor Demo',
    email: 'taylor.demo@example.test',
    phone: '+237600000103',
    password: 'DemoPass123!',
    isVerified: true,
    isAdmin: false
  }
];

try {
  await sequelize.authenticate();

  await sequelize.transaction(async (transaction) => {
    const users = [];

    for (const values of demoUsers) {
      const [user] = await User.findOrCreate({
        where: { email: values.email },
        defaults: values,
        transaction
      });
      users.push(user);
    }

    const [firstTransfer] = await Transaction.findOrCreate({
      where: { reference: 'DEMO-TRANSFER-0001' },
      defaults: {
        sender_id: users[0].id,
        recipient_id: users[1].id,
        amount: '12500.00',
        narration: 'Demo transfer to Sam',
        status: 'completed',
        type: 'transfer'
      },
      transaction
    });

    await Transaction.findOrCreate({
      where: { reference: 'DEMO-TRANSFER-0002' },
      defaults: {
        sender_id: users[1].id,
        recipient_id: users[2].id,
        amount: '4500.00',
        narration: 'Demo transfer to Taylor',
        status: 'completed',
        type: 'transfer'
      },
      transaction
    });

    await Payment.findOrCreate({
      where: { transaction_id: 'DEMO-PAYMENT-0001' },
      defaults: {
        user_id: users[0].id,
        transaction_id: 'DEMO-PAYMENT-0001',
        amount: '3200.00',
        currency: 'XAF',
        status: 'completed',
        payment_method: 'mobile_money',
        payment_details: { merchant: 'Demo Market', type: 'merchant_payment' }
      },
      transaction
    });

    const notifications = [
      {
        user_id: users[0].id,
        message: 'Your demo account is ready to use.'
      },
      {
        user_id: users[1].id,
        message: 'You received a demo transfer of XAF 12,500.00.'
      },
      {
        user_id: users[2].id,
        message: 'You received a demo transfer of XAF 4,500.00.'
      }
    ];

    for (const values of notifications) {
      await Notification.findOrCreate({
        where: values,
        defaults: values,
        transaction
      });
    }

    console.log(`Seeded demo data. Login email: ${demoUsers[0].email}`);
    console.log('Demo password for all accounts: DemoPass123!');
    console.log(`Example transfer reference: ${firstTransfer.reference}`);
  });
} catch (error) {
  console.error('Failed to seed demo data:', error);
  process.exitCode = 1;
} finally {
  await sequelize.close();
}
