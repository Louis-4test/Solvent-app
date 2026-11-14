import { Op, fn, col } from 'sequelize';
import { User, Transaction, Payment, KYC } from '../models/index.js';

const ADMIN_USER_ATTRIBUTES = [
  'id',
  'fullName',
  'email',
  'phone',
  'avatarUrl',
  'isVerified',
  'isAdmin',
  'isActive',
  'kycVerified',
  'kycVerifiedAt',
  'mfaEnabled',
  'createdAt',
  'updatedAt'
];

const toNumber = (value) => {
  const number = Number.parseFloat(value ?? 0);
  return Number.isFinite(number) ? number : 0;
};

const toBoolean = (value) =>
  value === true || value === 'true' || value === 1 || value === '1';

const getPagination = (req) => {
  const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit, 10) || 10));

  return { page, limit, offset: (page - 1) * limit };
};

const paginationPayload = (total, page, limit) => ({
  page,
  limit,
  total,
  totalPages: Math.max(1, Math.ceil(total / limit))
});

const dateKey = (date) => {
  const pad = (value) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

const userSummaryInclude = (as) => ({
  model: User,
  as,
  attributes: ['id', 'fullName', 'email', 'avatarUrl']
});

const findMatchingUserIds = async (search) => {
  if (!search) return [];

  const pattern = `%${search}%`;
  const users = await User.findAll({
    where: {
      [Op.or]: [
        { fullName: { [Op.like]: pattern } },
        { email: { [Op.like]: pattern } },
        { phone: { [Op.like]: pattern } }
      ]
    },
    attributes: ['id'],
    raw: true
  });

  return users.map((user) => user.id);
};

export const getAdminDashboard = async (_req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const trendStart = new Date(today);
    trendStart.setDate(trendStart.getDate() - 6);

    const [
      totalUsers,
      activeUsers,
      verifiedUsers,
      kycVerifiedUsers,
      adminUsers,
      suspendedUsers,
      totalTransactions,
      completedTransactions,
      transactionVolume,
      totalPayments,
      completedPayments,
      paymentVolume,
      recentTransactions,
      recentUsers,
      transactionTrendRows,
      paymentTrendRows,
      paymentMixRows
    ] = await Promise.all([
      User.count(),
      User.count({ where: { isActive: true } }),
      User.count({ where: { isVerified: true } }),
      User.count({ where: { kycVerified: true } }),
      User.count({ where: { isAdmin: true } }),
      User.count({ where: { isActive: false } }),
      Transaction.count(),
      Transaction.count({ where: { status: 'completed' } }),
      Transaction.sum('amount', { where: { status: 'completed' } }),
      Payment.count(),
      Payment.count({ where: { status: 'completed' } }),
      Payment.sum('amount', { where: { status: 'completed' } }),
      Transaction.findAll({
        order: [['created_at', 'DESC']],
        limit: 6,
        include: [userSummaryInclude('Sender'), userSummaryInclude('Recipient')]
      }),
      User.findAll({
        attributes: ADMIN_USER_ATTRIBUTES,
        order: [['createdAt', 'DESC']],
        limit: 5
      }),
      Transaction.findAll({
        where: { created_at: { [Op.gte]: trendStart } },
        attributes: ['created_at', 'amount', 'status'],
        raw: true
      }),
      Payment.findAll({
        where: { created_at: { [Op.gte]: trendStart } },
        attributes: ['created_at', 'amount', 'status'],
        raw: true
      }),
      Payment.findAll({
        attributes: [
          'payment_method',
          [fn('COUNT', col('id')), 'count'],
          [fn('SUM', col('amount')), 'total']
        ],
        group: ['payment_method'],
        raw: true
      })
    ]);

    const trend = [];

    for (let index = 6; index >= 0; index -= 1) {
      const day = new Date(today);
      day.setDate(day.getDate() - index);

      trend.push({
        key: dateKey(day),
        label: day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        transactions: 0,
        transactionVolume: 0,
        payments: 0,
        paymentVolume: 0
      });
    }

    const trendByDay = new Map(trend.map((entry) => [entry.key, entry]));

    for (const transaction of transactionTrendRows) {
      const entry = trendByDay.get(dateKey(new Date(transaction.created_at)));

      if (!entry) continue;

      entry.transactions += 1;

      if (transaction.status === 'completed') {
        entry.transactionVolume += toNumber(transaction.amount);
      }
    }

    for (const payment of paymentTrendRows) {
      const entry = trendByDay.get(dateKey(new Date(payment.created_at)));

      if (!entry) continue;

      entry.payments += 1;

      if (payment.status === 'completed') {
        entry.paymentVolume += toNumber(payment.amount);
      }
    }

    const paymentMix = paymentMixRows
      .map((row) => ({
        method: row.payment_method || 'unknown',
        count: toNumber(row.count),
        total: toNumber(row.total)
      }))
      .sort((a, b) => b.total - a.total);

    return res.json({
      success: true,
      data: {
        overview: {
          totalUsers,
          activeUsers,
          verifiedUsers,
          unverifiedUsers: Math.max(0, totalUsers - verifiedUsers),
          kycVerifiedUsers,
          kycPendingUsers: Math.max(0, totalUsers - kycVerifiedUsers),
          adminUsers,
          suspendedUsers,
          totalTransactions,
          completedTransactions,
          transactionVolume: toNumber(transactionVolume),
          totalPayments,
          completedPayments,
          paymentVolume: toNumber(paymentVolume)
        },
        trend,
        paymentMix,
        recentTransactions,
        recentUsers
      }
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to load admin dashboard',
      code: 'ADMIN_DASHBOARD_FAILED'
    });
  }
};

export const getAdminUsers = async (req, res) => {
  try {
    const { page, limit, offset } = getPagination(req);
    const search = String(req.query.search || '').trim();
    const role = String(req.query.role || '').trim();
    const status = String(req.query.status || '').trim();
    const kyc = String(req.query.kyc || '').trim();
    const conditions = [];

    if (search) {
      const pattern = `%${search}%`;
      conditions.push({
        [Op.or]: [
          { fullName: { [Op.like]: pattern } },
          { email: { [Op.like]: pattern } },
          { phone: { [Op.like]: pattern } }
        ]
      });
    }

    if (role === 'admin') conditions.push({ isAdmin: true });
    if (role === 'user') conditions.push({ isAdmin: false });
    if (status === 'active') conditions.push({ isActive: true });
    if (status === 'suspended') conditions.push({ isActive: false });
    if (kyc === 'verified') conditions.push({ kycVerified: true });
    if (kyc === 'pending') conditions.push({ kycVerified: false });

    const where = conditions.length ? { [Op.and]: conditions } : {};

    const { rows, count } = await User.findAndCountAll({
      where,
      attributes: ADMIN_USER_ATTRIBUTES,
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });

    return res.json({
      success: true,
      data: rows,
      pagination: paginationPayload(count, page, limit)
    });
  } catch (error) {
    console.error('Admin users error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to load users',
      code: 'ADMIN_USERS_FAILED'
    });
  }
};

export const updateAdminUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    const changes = {};
    for (const field of ['isAdmin', 'isVerified', 'kycVerified', 'isActive']) {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        changes[field] = toBoolean(req.body[field]);
      }
    }

    if (Object.keys(changes).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No supported user fields were provided',
        code: 'NO_USER_UPDATES'
      });
    }

    const isSelf = user.id === req.user.id;

    if (isSelf && (changes.isAdmin === false || changes.isActive === false)) {
      return res.status(400).json({
        success: false,
        error: 'You cannot remove your own admin access or suspend your own account',
        code: 'SELF_ADMIN_CHANGE'
      });
    }

    const removesActiveAdmin =
      user.isAdmin &&
      user.isActive &&
      (changes.isAdmin === false || changes.isActive === false);

    if (removesActiveAdmin) {
      const remainingAdmins = await User.count({
        where: {
          isAdmin: true,
          isActive: true,
          id: { [Op.ne]: user.id }
        }
      });

      if (remainingAdmins === 0) {
        return res.status(400).json({
          success: false,
          error: 'At least one active administrator must remain',
          code: 'LAST_ADMIN'
        });
      }
    }

    await user.update(changes);

    return res.json({
      success: true,
      message: 'User updated successfully',
      data: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        avatarUrl: user.avatarUrl,
        isVerified: user.isVerified,
        isAdmin: user.isAdmin,
        isActive: user.isActive,
        kycVerified: user.kycVerified,
        kycVerifiedAt: user.kycVerifiedAt,
        mfaEnabled: user.mfaEnabled,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });
  } catch (error) {
    console.error('Admin update user error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update user',
      code: 'ADMIN_USER_UPDATE_FAILED'
    });
  }
};

export const getAdminTransactions = async (req, res) => {
  try {
    const { page, limit, offset } = getPagination(req);
    const search = String(req.query.search || '').trim();
    const status = String(req.query.status || '').trim();
    const type = String(req.query.type || '').trim();
    const conditions = [];

    if (search) {
      const pattern = `%${search}%`;
      const matchingUserIds = await findMatchingUserIds(search);
      const searchConditions = [
        { reference: { [Op.like]: pattern } },
        { narration: { [Op.like]: pattern } }
      ];

      if (matchingUserIds.length) {
        searchConditions.push({ sender_id: { [Op.in]: matchingUserIds } });
        searchConditions.push({ recipient_id: { [Op.in]: matchingUserIds } });
      }

      conditions.push({ [Op.or]: searchConditions });
    }

    if (['pending', 'completed', 'failed', 'reversed'].includes(status)) {
      conditions.push({ status });
    }

    if (['transfer', 'deposit', 'withdrawal', 'payment'].includes(type)) {
      conditions.push({ type });
    }

    const where = conditions.length ? { [Op.and]: conditions } : {};

    const { rows, count } = await Transaction.findAndCountAll({
      where,
      order: [['created_at', 'DESC']],
      limit,
      offset,
      include: [userSummaryInclude('Sender'), userSummaryInclude('Recipient')]
    });

    return res.json({
      success: true,
      data: rows,
      pagination: paginationPayload(count, page, limit)
    });
  } catch (error) {
    console.error('Admin transactions error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to load transactions',
      code: 'ADMIN_TRANSACTIONS_FAILED'
    });
  }
};

export const updateAdminTransactionStatus = async (req, res) => {
  try {
    const allowedStatuses = ['pending', 'completed', 'failed', 'reversed'];
    const { status } = req.body;

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid transaction status',
        code: 'INVALID_TRANSACTION_STATUS'
      });
    }

    const transaction = await Transaction.findByPk(req.params.id);

    if (!transaction) {
      return res.status(404).json({
        success: false,
        error: 'Transaction not found',
        code: 'TRANSACTION_NOT_FOUND'
      });
    }

    await transaction.update({ status });

    return res.json({
      success: true,
      message: 'Transaction status updated successfully',
      data: transaction
    });
  } catch (error) {
    console.error('Admin transaction update error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update transaction',
      code: 'ADMIN_TRANSACTION_UPDATE_FAILED'
    });
  }
};

export const getAdminKYC = async (req, res) => {
  try {
    const { page, limit, offset } = getPagination(req);
    const status = String(req.query.status || '').trim();
    const search = String(req.query.search || '').trim();
    const conditions = [];

    if (['pending', 'under_review', 'approved', 'rejected'].includes(status)) {
      conditions.push({ status });
    }

    if (search) {
      const pattern = `%${search}%`;
      const matchingUserIds = await findMatchingUserIds(search);
      const searchConditions = [
        { document_number: { [Op.like]: pattern } },
        { document_type: { [Op.like]: pattern } }
      ];

      if (matchingUserIds.length) {
        searchConditions.push({ user_id: { [Op.in]: matchingUserIds } });
      }

      conditions.push({ [Op.or]: searchConditions });
    }

    const where = conditions.length ? { [Op.and]: conditions } : {};

    const { rows, count } = await KYC.findAndCountAll({
      where,
      order: [['submitted_at', 'DESC']],
      limit,
      offset,
      include: [
        {
          model: User,
          as: 'Applicant',
          attributes: ['id', 'fullName', 'email', 'phone', 'avatarUrl', 'kycVerified']
        },
        {
          model: User,
          as: 'Reviewer',
          attributes: ['id', 'fullName', 'email'],
          required: false
        }
      ]
    });

    return res.json({
      success: true,
      data: rows.map((submission) => ({
        id: submission.id,
        userId: submission.user_id,
        applicant: submission.Applicant,
        documentType: submission.document_type,
        documentNumber: submission.document_number,
        documentFrontUrl: submission.document_front_url,
        documentBackUrl: submission.document_back_url,
        selfieUrl: submission.selfie_url,
        status: submission.status,
        rejectionReason: submission.rejection_reason,
        verifiedAt: submission.verified_at,
        submittedAt: submission.submitted_at,
        reviewedBy: submission.reviewed_by,
        reviewer: submission.Reviewer
      })),
      pagination: paginationPayload(count, page, limit)
    });
  } catch (error) {
    console.error('Admin KYC error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to load KYC submissions',
      code: 'ADMIN_KYC_FAILED'
    });
  }
};

export const getAdminPayments = async (req, res) => {
  try {
    const { page, limit, offset } = getPagination(req);
    const search = String(req.query.search || '').trim();
    const status = String(req.query.status || '').trim();
    const method = String(req.query.method || '').trim();
    const conditions = [];

    if (search) {
      const pattern = `%${search}%`;
      const matchingUserIds = await findMatchingUserIds(search);
      const searchConditions = [{ transaction_id: { [Op.like]: pattern } }];

      if (matchingUserIds.length) {
        searchConditions.push({ user_id: { [Op.in]: matchingUserIds } });
      }

      conditions.push({ [Op.or]: searchConditions });
    }

    if (['pending', 'completed', 'failed', 'refunded'].includes(status)) {
      conditions.push({ status });
    }

    if (['card', 'bank_transfer', 'mobile_money', 'crypto'].includes(method)) {
      conditions.push({ payment_method: method });
    }

    const where = conditions.length ? { [Op.and]: conditions } : {};

    const { rows, count } = await Payment.findAndCountAll({
      where,
      order: [['created_at', 'DESC']],
      limit,
      offset,
      include: [
        {
          model: User,
          attributes: ['id', 'fullName', 'email', 'avatarUrl']
        }
      ]
    });

    return res.json({
      success: true,
      data: rows,
      pagination: paginationPayload(count, page, limit)
    });
  } catch (error) {
    console.error('Admin payments error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to load payments',
      code: 'ADMIN_PAYMENTS_FAILED'
    });
  }
};
