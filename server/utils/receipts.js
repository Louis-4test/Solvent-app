const METHOD_LABELS = {
  card: 'Card',
  bank_transfer: 'Bank transfer',
  mobile_money: 'Mobile money',
  crypto: 'Crypto'
};

const STATUS_LABELS = {
  pending: 'Pending',
  completed: 'Completed',
  failed: 'Failed',
  reversed: 'Reversed',
  refunded: 'Refunded'
};

const safeNumber = (value) => {
  const number = Number.parseFloat(value ?? 0);
  return Number.isFinite(number) ? number : 0;
};

export const parsePaymentDetails = (value) => {
  if (!value) return {};
  if (typeof value === 'object') return value;

  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
};

const userSummary = (user) => {
  if (!user) return null;

  return {
    id: user.id,
    name: user.fullName || user.name || user.email || 'Solvent user',
    email: user.email || null,
    phone: user.phone || null,
    avatarUrl: user.avatarUrl || null
  };
};

const paymentTitle = (details) => {
  if (details.type === 'merchant_qr' || details.type === 'merchant_payment') {
    return 'Merchant payment';
  }
  if (details.type === 'bill_payment' || details.service) {
    return 'Bill payment';
  }
  if (details.type === 'airtime') return 'Airtime purchase';
  return 'Payment';
};

export const buildPaymentReceipt = (payment, options = {}) => {
  const details = parsePaymentDetails(payment.payment_details);
  const payer = options.user || payment.User || null;
  const merchant = details.merchant && typeof details.merchant === 'object'
    ? details.merchant
    : null;
  const merchantName =
    merchant?.name ||
    details.merchantName ||
    (typeof details.merchant === 'string' ? details.merchant : null);
  const serviceName = details.service || details.biller || null;

  return {
    reference: payment.transaction_id,
    receiptNumber: payment.transaction_id,
    kind: 'payment',
    title: paymentTitle(details),
    amount: safeNumber(payment.amount),
    currency: payment.currency || 'XAF',
    status: payment.status,
    statusLabel: STATUS_LABELS[payment.status] || payment.status,
    method: payment.payment_method,
    methodLabel: METHOD_LABELS[payment.payment_method] || payment.payment_method,
    date: payment.created_at,
    payer: userSummary(payer),
    recipient: merchantName || serviceName
      ? {
          name: merchantName || serviceName,
          code: merchant?.code || details.merchantCode || null,
          category: merchant?.category || details.category || null,
          city: merchant?.city || details.city || null
        }
      : null,
    merchant: merchantName
      ? {
          name: merchantName,
          code: merchant?.code || details.merchantCode || null,
          category: merchant?.category || details.category || null,
          city: merchant?.city || details.city || null,
          description: merchant?.description || null
        }
      : null,
    serviceName,
    accountNumber: details.accountNumber || details.customerNumber || null,
    narration: details.narration || details.note || details.description || null,
    details: {
      ...details,
      merchant: merchant || (merchantName ? { name: merchantName } : undefined)
    }
  };
};

export const buildTransactionReceipt = (transaction) => {
  const sender = userSummary(transaction.Sender);
  const recipient = userSummary(transaction.Recipient);

  return {
    reference: transaction.reference,
    receiptNumber: transaction.reference,
    kind: transaction.type === 'payment' ? 'payment' : 'transfer',
    title:
      transaction.type === 'transfer'
        ? 'Money transfer'
        : transaction.type === 'deposit'
          ? 'Deposit'
          : transaction.type === 'withdrawal'
            ? 'Withdrawal'
            : 'Transaction',
    amount: safeNumber(transaction.amount),
    currency: 'XAF',
    status: transaction.status,
    statusLabel: STATUS_LABELS[transaction.status] || transaction.status,
    method: transaction.type,
    methodLabel: 'Solvent transfer',
    date: transaction.created_at,
    payer: sender,
    recipient,
    merchant: null,
    serviceName: null,
    accountNumber: null,
    narration: transaction.narration || null,
    details: {
      type: transaction.type,
      senderId: transaction.sender_id,
      recipientId: transaction.recipient_id
    }
  };
};

export default {
  buildPaymentReceipt,
  buildTransactionReceipt,
  parsePaymentDetails
};
