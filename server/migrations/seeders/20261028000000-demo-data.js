import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sequelize from '../../config/db.js';
import { KYC, Merchant, Notification, Payment, Transaction, User } from '../../models/index.js';

const DEMO_KYC_DIR = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../uploads/kyc'
);

const DEMO_DOCUMENTS = {
  'demo-front.svg': `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="400" viewBox="0 0 640 400" role="img" aria-label="Demo identity document">
    <rect width="640" height="400" rx="20" fill="#eef4ff"/>
    <rect x="30" y="30" width="580" height="340" rx="14" fill="#ffffff" stroke="#1a73e8" stroke-width="4"/>
    <text x="320" y="150" text-anchor="middle" font-family="Arial, sans-serif" font-size="34" font-weight="700" fill="#1a73e8">SOLVENT DEMO ID</text>
    <text x="320" y="205" text-anchor="middle" font-family="Arial, sans-serif" font-size="22" fill="#334155">Sample National Identity Card</text>
    <text x="320" y="255" text-anchor="middle" font-family="Arial, sans-serif" font-size="18" fill="#64748b">For interface preview only · Not a real document</text>
  </svg>`,
  'demo-selfie.svg': `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400" role="img" aria-label="Demo selfie">
    <rect width="400" height="400" rx="24" fill="#eef4ff"/>
    <circle cx="200" cy="155" r="70" fill="#cbd5e1"/>
    <path d="M80 350c0-72 54-130 120-130s120 58 120 130" fill="#cbd5e1"/>
    <text x="200" y="378" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" fill="#64748b">Solvent demo selfie</text>
  </svg>`
};

const ensureDemoKycDocuments = () => {
  fs.mkdirSync(DEMO_KYC_DIR, { recursive: true });

  for (const [filename, contents] of Object.entries(DEMO_DOCUMENTS)) {
    const filePath = path.join(DEMO_KYC_DIR, filename);

    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, contents);
    }
  }
};

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
  },
  {
    fullName: 'Admin Demo',
    email: 'admin.demo@example.test',
    phone: '+237600000104',
    password: 'DemoPass123!',
    isVerified: true,
    isAdmin: true
  }
];

try {
  await sequelize.authenticate();
  ensureDemoKycDocuments();

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

    const demoMerchants = [
      {
        code: 'MRC-SOLVENT-MARKET',
        name: 'Solvent Market',
        category: 'Retail',
        city: 'Douala',
        description: 'Everyday groceries and household goods'
      },
      {
        code: 'MRC-BLUE-CAFE',
        name: 'Blue Cafe',
        category: 'Food & drink',
        city: 'Douala',
        description: 'Coffee, pastries, and quick lunches'
      },
      {
        code: 'MRC-CITY-PHARMACY',
        name: 'City Pharmacy',
        category: 'Health',
        city: 'Yaounde',
        description: 'Prescriptions and wellness products'
      },
      {
        code: 'MRC-ENERGY-HUB',
        name: 'Energy Hub',
        category: 'Utilities',
        city: 'Douala',
        description: 'Electricity and airtime top-ups'
      }
    ];

    for (const values of demoMerchants) {
      await Merchant.findOrCreate({
        where: { code: values.code },
        defaults: values,
        transaction
      });
    }

    const [demoKyc] = await KYC.findOrCreate({
      where: { user_id: users[1].id, document_number: 'DEMO-KYC-0001' },
      defaults: {
        user_id: users[1].id,
        document_type: 'national_id',
        document_number: 'DEMO-KYC-0001',
        document_front_url: '/uploads/kyc/demo-front.svg',
        selfie_url: '/uploads/kyc/demo-selfie.svg',
        status: 'approved',
        verified_at: new Date()
      },
      transaction
    });

    await demoKyc.update({
      document_front_url: '/uploads/kyc/demo-front.svg',
      selfie_url: '/uploads/kyc/demo-selfie.svg'
    }, { transaction });

    await users[1].update(
      { kycVerified: true, kycVerifiedAt: new Date() },
      { transaction }
    );

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
    console.log('Admin demo login: admin.demo@example.test');
    console.log('Demo merchant QR codes: MRC-SOLVENT-MARKET, MRC-BLUE-CAFE');
    console.log('Demo password for all accounts: DemoPass123!');
    console.log(`Example transfer reference: ${firstTransfer.reference}`);
  });
} catch (error) {
  console.error('Failed to seed demo data:', error);
  process.exitCode = 1;
} finally {
  await sequelize.close();
}
