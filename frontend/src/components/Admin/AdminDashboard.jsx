/* eslint-disable react/prop-types */
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField
} from '@mui/material';
import Sidebar, { TopNavbar } from '../Layout/Sidebar';
import adminAPI from '../../services/adminAPI';
import { resolveMediaUrl } from '../../services/api';
import { getUser } from '../../utils/auth';
import './Admin.css';

const PAGE_SIZE = 8;

const ADMIN_TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'users', label: 'Users' },
  { id: 'kyc', label: 'KYC' },
  { id: 'transactions', label: 'Transactions' },
  { id: 'payments', label: 'Payments' }
];

const STATUS_LABELS = {
  pending: 'Pending',
  completed: 'Completed',
  failed: 'Failed',
  reversed: 'Reversed',
  refunded: 'Refunded',
  active: 'Active',
  suspended: 'Suspended',
  verified: 'Verified',
  under_review: 'Under review',
  approved: 'Approved',
  rejected: 'Rejected'
};

const STATUS_TONES = {
  completed: 'success',
  active: 'success',
  verified: 'success',
  pending: 'warning',
  failed: 'danger',
  suspended: 'danger',
  under_review: 'info',
  approved: 'success',
  rejected: 'danger',
  reversed: 'neutral',
  refunded: 'neutral'
};

const PAYMENT_METHODS = {
  card: 'Card',
  bank_transfer: 'Bank transfer',
  mobile_money: 'Mobile money',
  crypto: 'Crypto'
};

const formatMoney = (value) =>
  `XAF ${Number(value || 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}`;

const formatNumber = (value) => Number(value || 0).toLocaleString('en-US');

const formatDate = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const formatDateTime = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const getInitials = (user) => {
  const source = user?.fullName || user?.email || 'User';
  return source
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
};

const LoadingState = ({ label = 'Loading data...' }) => (
  <div className="admin-loading">
    <span className="admin-spinner" aria-hidden="true" />
    <p>{label}</p>
  </div>
);

const EmptyState = ({ title, description }) => (
  <div className="admin-empty">
    <strong>{title}</strong>
    <p>{description}</p>
  </div>
);

const StatusPill = ({ status }) => {
  const label = STATUS_LABELS[status] || String(status || '-').replace(/_/g, ' ');
  const tone = STATUS_TONES[status] || 'neutral';
  return <span className={`admin-pill ${tone}`}>{label}</span>;
};

const UserAvatar = ({ user }) => (
  <span className="admin-avatar" aria-hidden="true">
    {user?.avatarUrl ? (
      <img src={resolveMediaUrl(user.avatarUrl)} alt="" />
    ) : (
      getInitials(user)
    )}
  </span>
);

const Pagination = ({ pagination, onPageChange }) => {
  if (!pagination) return null;

  return (
    <div className="admin-pagination">
      <span>
        {formatNumber(pagination.total)} record{pagination.total === 1 ? '' : 's'}
      </span>
      <div className="admin-pagination-controls">
        <button
          type="button"
          disabled={pagination.page <= 1}
          onClick={() => onPageChange(pagination.page - 1)}
        >
          Previous
        </button>
        <span>
          Page {pagination.page} of {pagination.totalPages}
        </span>
        <button
          type="button"
          disabled={pagination.page >= pagination.totalPages}
          onClick={() => onPageChange(pagination.page + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
};

const KpiCard = ({ label, value, meta, tone = 'blue' }) => (
  <article className={`admin-kpi ${tone}`}>
    <span className="admin-kpi-label">{label}</span>
    <strong>{value}</strong>
    <span className="admin-kpi-meta">{meta}</span>
  </article>
);

const OverviewTab = ({ dashboard, loading, onOpenTab }) => {
  if (loading && !dashboard) {
    return <LoadingState label="Loading platform overview..." />;
  }

  if (!dashboard) {
    return (
      <div className="admin-panel">
        <EmptyState
          title="No overview data"
          description="Refresh the dashboard to try loading platform statistics again."
        />
      </div>
    );
  }

  const { overview, trend, paymentMix, recentTransactions, recentUsers } = dashboard;
  const maxMix = Math.max(...paymentMix.map((item) => item.total), 1);

  return (
    <div className="admin-overview">
      <section className="admin-kpis" aria-label="Platform statistics">
        <KpiCard
          label="Total users"
          value={formatNumber(overview.totalUsers)}
          meta={`${formatNumber(overview.activeUsers)} active`}
        />
        <KpiCard
          label="KYC verified"
          value={formatNumber(overview.kycVerifiedUsers)}
          meta={`${formatNumber(overview.kycPendingUsers)} pending`}
          tone="green"
        />
        <KpiCard
          label="Transfer volume"
          value={formatMoney(overview.transactionVolume)}
          meta={`${formatNumber(overview.totalTransactions)} transfers`}
          tone="blue"
        />
        <KpiCard
          label="Payment volume"
          value={formatMoney(overview.paymentVolume)}
          meta={`${formatNumber(overview.totalPayments)} payments`}
          tone="violet"
        />
      </section>

      <section className="admin-overview-grid">
        <div className="admin-panel admin-chart-panel">
          <div className="admin-panel-heading">
            <div>
              <h3>Platform activity</h3>
              <p>Completed transfer and payment volume over the last 7 days.</p>
            </div>
            <span className="admin-chart-legend">
              <i className="legend-transfer" /> Transfers
              <i className="legend-payment" /> Payments
            </span>
          </div>
          <div className="admin-chart">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend} margin={{ top: 8, right: 10, left: -12, bottom: 0 }}>
                <defs>
                  <linearGradient id="adminTransferFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1a73e8" stopOpacity={0.28} />
                    <stop offset="95%" stopColor="#1a73e8" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="adminPaymentFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#16a34a" stopOpacity={0.24} />
                    <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#e5e7eb" strokeDasharray="3 5" vertical={false} />
                <XAxis
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 12 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  tickFormatter={(value) => `${Math.round(value / 1000)}k`}
                />
                <Tooltip
                  formatter={(value, name) => [formatMoney(value), name]}
                  contentStyle={{ borderRadius: 10, border: '1px solid #e5e7eb', fontSize: 13 }}
                />
                <Area
                  type="monotone"
                  dataKey="transactionVolume"
                  name="Transfers"
                  stroke="#1a73e8"
                  strokeWidth={2.4}
                  fill="url(#adminTransferFill)"
                />
                <Area
                  type="monotone"
                  dataKey="paymentVolume"
                  name="Payments"
                  stroke="#16a34a"
                  strokeWidth={2.4}
                  fill="url(#adminPaymentFill)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="admin-panel admin-mix-panel">
          <div className="admin-panel-heading">
            <div>
              <h3>Payment mix</h3>
              <p>Volume by payment method.</p>
            </div>
          </div>

          {paymentMix.length === 0 ? (
            <EmptyState
              title="No payments yet"
              description="Payment methods will appear after the first payment."
            />
          ) : (
            <div className="admin-mix-list">
              {paymentMix.map((item) => (
                <div className="admin-mix-item" key={item.method}>
                  <div className="admin-mix-heading">
                    <span>{PAYMENT_METHODS[item.method] || item.method.replace(/_/g, ' ')}</span>
                    <strong>{formatMoney(item.total)}</strong>
                  </div>
                  <div className="admin-mix-track" aria-hidden="true">
                    <span style={{ width: `${Math.max(6, (item.total / maxMix) * 100)}%` }} />
                  </div>
                  <small>{formatNumber(item.count)} payment{item.count === 1 ? '' : 's'}</small>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="admin-overview-grid admin-overview-lower">
        <div className="admin-panel">
          <div className="admin-panel-heading">
            <div>
              <h3>Recent transactions</h3>
              <p>Latest money movement across the platform.</p>
            </div>
            <button type="button" className="admin-text-button" onClick={() => onOpenTab('transactions')}>
              View all
            </button>
          </div>

          {recentTransactions.length === 0 ? (
            <EmptyState
              title="No transactions yet"
              description="Transfers will show up here as soon as users start sending money."
            />
          ) : (
            <div className="admin-table-scroll">
              <table className="admin-table admin-compact-table">
                <thead>
                  <tr>
                    <th>Reference</th>
                    <th>Route</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTransactions.map((transaction) => (
                    <tr key={transaction.id}>
                      <td className="admin-mono">{transaction.reference || `TXN-${transaction.id}`}</td>
                      <td>
                        {transaction.Sender?.fullName || 'Unknown'}
                        <span className="admin-route-arrow">to</span>
                        {transaction.Recipient?.fullName || 'Unknown'}
                      </td>
                      <td className="admin-amount">{formatMoney(transaction.amount)}</td>
                      <td><StatusPill status={transaction.status} /></td>
                      <td>{formatDateTime(transaction.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="admin-panel">
          <div className="admin-panel-heading">
            <div>
              <h3>Newest accounts</h3>
              <p>Recently registered users.</p>
            </div>
            <button type="button" className="admin-text-button" onClick={() => onOpenTab('users')}>
              Manage users
            </button>
          </div>

          {recentUsers.length === 0 ? (
            <EmptyState title="No users yet" description="New accounts will appear here." />
          ) : (
            <div className="admin-user-list">
              {recentUsers.map((user) => (
                <div className="admin-user-list-item" key={user.id}>
                  <UserAvatar user={user} />
                  <div className="admin-user-list-copy">
                    <strong>{user.fullName}</strong>
                    <span>{user.email}</span>
                  </div>
                  <div className="admin-user-list-meta">
                    <span className={`admin-pill ${user.isAdmin ? 'info' : 'neutral'}`}>
                      {user.isAdmin ? 'Admin' : 'User'}
                    </span>
                    <small>{formatDate(user.createdAt)}</small>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

const UsersTab = ({
  users,
  pagination,
  loading,
  query,
  searchDraft,
  onSearchDraftChange,
  onSearch,
  onFilterChange,
  onPageChange,
  currentUserId,
  onToggleAdmin,
  onToggleKyc,
  onToggleActive
}) => (
  <section className="admin-panel">
    <div className="admin-panel-heading admin-panel-heading-stack">
      <div>
        <h3>User management</h3>
        <p>Search accounts and manage access, verification, and KYC status.</p>
      </div>

      <form className="admin-toolbar" onSubmit={onSearch}>
        <input
          type="search"
          value={searchDraft}
          onChange={(event) => onSearchDraftChange(event.target.value)}
          placeholder="Search name, email, or phone"
          aria-label="Search users"
        />
        <select
          value={query.role}
          onChange={(event) => onFilterChange('role', event.target.value)}
          aria-label="Filter by role"
        >
          <option value="">All roles</option>
          <option value="admin">Admins</option>
          <option value="user">Regular users</option>
        </select>
        <select
          value={query.status}
          onChange={(event) => onFilterChange('status', event.target.value)}
          aria-label="Filter by account status"
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
        </select>
        <select
          value={query.kyc}
          onChange={(event) => onFilterChange('kyc', event.target.value)}
          aria-label="Filter by KYC status"
        >
          <option value="">All KYC</option>
          <option value="verified">Verified</option>
          <option value="pending">Pending</option>
        </select>
        <button type="submit" className="admin-search-button">Search</button>
      </form>
    </div>

    {loading ? (
      <LoadingState label="Loading users..." />
    ) : users.length === 0 ? (
      <EmptyState title="No users found" description="Try a different search term or clear the filters." />
    ) : (
      <>
        <div className="admin-table-scroll">
          <table className="admin-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Phone</th>
                <th>Role</th>
                <th>KYC</th>
                <th>Account</th>
                <th>Joined</th>
                <th className="admin-align-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => {
                const isSelf = user.id === currentUserId;

                return (
                  <tr key={user.id}>
                    <td>
                      <div className="admin-user-cell">
                        <UserAvatar user={user} />
                        <div>
                          <strong>{user.fullName}</strong>
                          <span>{user.email}</span>
                        </div>
                        {isSelf && <span className="admin-you">You</span>}
                      </div>
                    </td>
                    <td>{user.phone || '-'}</td>
                    <td>
                      <span className={`admin-pill ${user.isAdmin ? 'info' : 'neutral'}`}>
                        {user.isAdmin ? 'Admin' : 'User'}
                      </span>
                    </td>
                    <td>
                      <span className={`admin-pill ${user.kycVerified ? 'success' : 'warning'}`}>
                        {user.kycVerified ? 'Verified' : 'Pending'}
                      </span>
                    </td>
                    <td><StatusPill status={user.isActive ? 'active' : 'suspended'} /></td>
                    <td>{formatDate(user.createdAt)}</td>
                    <td>
                      <div className="admin-row-actions">
                        <button
                          type="button"
                          className="admin-action"
                          disabled={isSelf}
                          onClick={() => onToggleAdmin(user)}
                          title={isSelf ? 'You cannot change your own admin role' : undefined}
                        >
                          {user.isAdmin ? 'Remove admin' : 'Make admin'}
                        </button>
                        <button
                          type="button"
                          className="admin-action"
                          onClick={() => onToggleKyc(user)}
                        >
                          {user.kycVerified ? 'Unverify KYC' : 'Verify KYC'}
                        </button>
                        <button
                          type="button"
                          className={`admin-action${user.isActive ? ' danger' : ''}`}
                          disabled={isSelf}
                          onClick={() => onToggleActive(user)}
                          title={isSelf ? 'You cannot suspend your own account' : undefined}
                        >
                          {user.isActive ? 'Suspend' : 'Reactivate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <Pagination pagination={pagination} onPageChange={onPageChange} />
      </>
    )}
  </section>
);

const TransactionsTab = ({
  transactions,
  pagination,
  loading,
  query,
  searchDraft,
  onSearchDraftChange,
  onSearch,
  onFilterChange,
  onPageChange
}) => (
  <section className="admin-panel">
    <div className="admin-panel-heading admin-panel-heading-stack">
      <div>
        <h3>Transaction monitoring</h3>
        <p>Review transfers, their status, and the accounts involved.</p>
      </div>

      <form className="admin-toolbar" onSubmit={onSearch}>
        <input
          type="search"
          value={searchDraft}
          onChange={(event) => onSearchDraftChange(event.target.value)}
          placeholder="Search reference, note, or user"
          aria-label="Search transactions"
        />
        <select
          value={query.status}
          onChange={(event) => onFilterChange('status', event.target.value)}
          aria-label="Filter transactions by status"
        >
          <option value="">All statuses</option>
          <option value="completed">Completed</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
          <option value="reversed">Reversed</option>
        </select>
        <select
          value={query.type}
          onChange={(event) => onFilterChange('type', event.target.value)}
          aria-label="Filter transactions by type"
        >
          <option value="">All types</option>
          <option value="transfer">Transfer</option>
          <option value="payment">Payment</option>
          <option value="deposit">Deposit</option>
          <option value="withdrawal">Withdrawal</option>
        </select>
        <button type="submit" className="admin-search-button">Search</button>
      </form>
    </div>

    {loading ? (
      <LoadingState label="Loading transactions..." />
    ) : transactions.length === 0 ? (
      <EmptyState title="No transactions found" description="Try a different search or filter." />
    ) : (
      <>
        <div className="admin-table-scroll">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Reference</th>
                <th>Sender</th>
                <th>Recipient</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((transaction) => (
                <tr key={transaction.id}>
                  <td className="admin-mono">{transaction.reference || `TXN-${transaction.id}`}</td>
                  <td>{transaction.Sender?.fullName || 'Unknown'}</td>
                  <td>{transaction.Recipient?.fullName || 'Unknown'}</td>
                  <td className="admin-capitalize">{transaction.type}</td>
                  <td className="admin-amount">{formatMoney(transaction.amount)}</td>
                  <td><StatusPill status={transaction.status} /></td>
                  <td>{formatDateTime(transaction.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination pagination={pagination} onPageChange={onPageChange} />
      </>
    )}
  </section>
);

const PaymentsTab = ({
  payments,
  pagination,
  loading,
  query,
  searchDraft,
  onSearchDraftChange,
  onSearch,
  onFilterChange,
  onPageChange
}) => (
  <section className="admin-panel">
    <div className="admin-panel-heading admin-panel-heading-stack">
      <div>
        <h3>Payment monitoring</h3>
        <p>Track merchant and bill payments collected through the platform.</p>
      </div>

      <form className="admin-toolbar" onSubmit={onSearch}>
        <input
          type="search"
          value={searchDraft}
          onChange={(event) => onSearchDraftChange(event.target.value)}
          placeholder="Search reference or user"
          aria-label="Search payments"
        />
        <select
          value={query.status}
          onChange={(event) => onFilterChange('status', event.target.value)}
          aria-label="Filter payments by status"
        >
          <option value="">All statuses</option>
          <option value="completed">Completed</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
          <option value="refunded">Refunded</option>
        </select>
        <select
          value={query.method}
          onChange={(event) => onFilterChange('method', event.target.value)}
          aria-label="Filter payments by method"
        >
          <option value="">All methods</option>
          <option value="mobile_money">Mobile money</option>
          <option value="bank_transfer">Bank transfer</option>
          <option value="card">Card</option>
          <option value="crypto">Crypto</option>
        </select>
        <button type="submit" className="admin-search-button">Search</button>
      </form>
    </div>

    {loading ? (
      <LoadingState label="Loading payments..." />
    ) : payments.length === 0 ? (
      <EmptyState title="No payments found" description="Try a different search or filter." />
    ) : (
      <>
        <div className="admin-table-scroll">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Reference</th>
                <th>User</th>
                <th>Method</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => (
                <tr key={payment.id}>
                  <td className="admin-mono">{payment.transaction_id}</td>
                  <td>
                    <div className="admin-user-cell compact">
                      <UserAvatar user={payment.User} />
                      <div>
                        <strong>{payment.User?.fullName || 'Unknown user'}</strong>
                        <span>{payment.User?.email || '-'}</span>
                      </div>
                    </div>
                  </td>
                  <td>{PAYMENT_METHODS[payment.payment_method] || payment.payment_method}</td>
                  <td className="admin-amount">{formatMoney(payment.amount)}</td>
                  <td><StatusPill status={payment.status} /></td>
                  <td>{formatDateTime(payment.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination pagination={pagination} onPageChange={onPageChange} />
      </>
    )}
  </section>
);


const DOCUMENT_TYPE_LABELS = {
  national_id: 'National ID',
  passport: 'Passport',
  drivers_license: "Driver's licence",
  voters_card: "Voter's card"
};

const KYCTab = ({
  submissions,
  pagination,
  loading,
  query,
  searchDraft,
  onSearchDraftChange,
  onSearch,
  onFilterChange,
  onPageChange,
  onReview
}) => {
  const [rejectTarget, setRejectTarget] = useState(null);
  const [reason, setReason] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [viewError, setViewError] = useState('');

  const viewDocument = async (submission, side) => {
    setViewError('');
    const preview = window.open('', '_blank');

    try {
      const blob = await adminAPI.getKYCDocument(submission.id, side);
      const url = URL.createObjectURL(blob);

      if (preview) {
        preview.location.href = url;
      } else {
        const link = document.createElement('a');
        link.href = url;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.click();
      }

      window.setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (viewDocumentError) {
      preview?.close();
      setViewError(viewDocumentError.message || 'Could not open the KYC document.');
    }
  };

  const review = async (submission, decision, rejectionReason = '') => {
    setBusyId(submission.id);
    setViewError('');

    try {
      await onReview(submission.id, decision, rejectionReason);
      setRejectTarget(null);
      setReason('');
    } catch (reviewError) {
      setViewError(reviewError.message || 'Could not update this KYC submission.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section className="admin-panel">
      <div className="admin-panel-heading admin-panel-heading-stack">
        <div>
          <h3>KYC review queue</h3>
          <p>Inspect identity submissions, open documents, and approve or reject applicants.</p>
        </div>

        <form className="admin-toolbar" onSubmit={onSearch}>
          <input
            type="search"
            value={searchDraft}
            onChange={(event) => onSearchDraftChange(event.target.value)}
            placeholder="Search applicant or document"
            aria-label="Search KYC submissions"
          />
          <select
            value={query.status}
            onChange={(event) => onFilterChange('status', event.target.value)}
            aria-label="Filter KYC submissions by status"
          >
            <option value="">All statuses</option>
            <option value="pending">Pending</option>
            <option value="under_review">Under review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          <button type="submit" className="admin-search-button">Search</button>
        </form>
      </div>

      {viewError && <div className="admin-alert error" role="alert">{viewError}</div>}

      {loading ? (
        <LoadingState label="Loading KYC submissions..." />
      ) : submissions.length === 0 ? (
        <EmptyState
          title="No KYC submissions found"
          description="New identity submissions will appear here for review."
        />
      ) : (
        <>
          <div className="admin-table-scroll">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Applicant</th>
                  <th>Document</th>
                  <th>Submitted</th>
                  <th>Status</th>
                  <th>Reviewer</th>
                  <th className="admin-align-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((submission) => {
                  const isBusy = busyId === submission.id;
                  const isReviewable = ['pending', 'under_review'].includes(submission.status);
                  const canApprove = isReviewable;
                  const canReject = isReviewable;

                  return (
                    <tr key={submission.id}>
                      <td>
                        <div className="admin-user-cell">
                          <UserAvatar user={submission.applicant} />
                          <div>
                            <strong>{submission.applicant?.fullName || 'Unknown applicant'}</strong>
                            <span>{submission.applicant?.email || '-'}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="admin-kyc-document">
                          <strong>{DOCUMENT_TYPE_LABELS[submission.documentType] || submission.documentType}</strong>
                          <span className="admin-mono">{submission.documentNumber}</span>
                          {submission.rejectionReason && (
                            <small>{submission.rejectionReason}</small>
                          )}
                        </div>
                      </td>
                      <td>{formatDateTime(submission.submittedAt)}</td>
                      <td><StatusPill status={submission.status} /></td>
                      <td>{submission.reviewer?.fullName || '-'}</td>
                      <td>
                        <div className="admin-row-actions">
                          {submission.documentFrontUrl && (
                            <button
                              type="button"
                              className="admin-action"
                              onClick={() => viewDocument(submission, 'front')}
                            >
                              View front
                            </button>
                          )}
                          {submission.documentBackUrl && (
                            <button
                              type="button"
                              className="admin-action"
                              onClick={() => viewDocument(submission, 'back')}
                            >
                              View back
                            </button>
                          )}
                          {submission.selfieUrl && (
                            <button
                              type="button"
                              className="admin-action"
                              onClick={() => viewDocument(submission, 'selfie')}
                            >
                              Selfie
                            </button>
                          )}
                          {canApprove && (
                            <button
                              type="button"
                              className="admin-action"
                              disabled={isBusy}
                              onClick={() => review(submission, 'approve')}
                            >
                              {isBusy ? 'Working...' : 'Approve'}
                            </button>
                          )}
                          {canReject && (
                            <button
                              type="button"
                              className="admin-action danger"
                              disabled={isBusy}
                              onClick={() => {
                                setRejectTarget(submission);
                                setReason('');
                              }}
                            >
                              Reject
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <Pagination pagination={pagination} onPageChange={onPageChange} />
        </>
      )}

      <Dialog open={Boolean(rejectTarget)} onClose={() => !busyId && setRejectTarget(null)}>
        <DialogTitle>Reject KYC submission</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Explain what {rejectTarget?.applicant?.fullName || 'the applicant'} needs to correct. This reason is
            shown to the user.
          </DialogContentText>
          <TextField
            autoFocus
            fullWidth
            multiline
            minRows={3}
            label="Rejection reason"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            disabled={Boolean(busyId)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectTarget(null)} disabled={Boolean(busyId)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            disabled={Boolean(busyId) || !reason.trim()}
            onClick={() => review(rejectTarget, 'reject', reason.trim())}
          >
            {busyId ? 'Rejecting...' : 'Reject submission'}
          </Button>
        </DialogActions>
      </Dialog>
    </section>
  );
};

const AdminDashboard = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedTab = searchParams.get('tab');
  const activeTab = ADMIN_TABS.some((tab) => tab.id === requestedTab) ? requestedTab : 'overview';

  const [dashboard, setDashboard] = useState(null);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [users, setUsers] = useState({ data: [], pagination: null });
  const [usersLoading, setUsersLoading] = useState(false);
  const [transactions, setTransactions] = useState({ data: [], pagination: null });
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const [payments, setPayments] = useState({ data: [], pagination: null });
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [kycSubmissions, setKycSubmissions] = useState({ data: [], pagination: null });
  const [kycLoading, setKycLoading] = useState(false);

  const [userSearchDraft, setUserSearchDraft] = useState('');
  const [userQuery, setUserQuery] = useState({ search: '', role: '', status: '', kyc: '' });
  const [userPage, setUserPage] = useState(1);

  const [transactionSearchDraft, setTransactionSearchDraft] = useState('');
  const [transactionQuery, setTransactionQuery] = useState({ search: '', status: '', type: '' });
  const [transactionPage, setTransactionPage] = useState(1);

  const [paymentSearchDraft, setPaymentSearchDraft] = useState('');
  const [paymentQuery, setPaymentQuery] = useState({ search: '', status: '', method: '' });
  const [paymentPage, setPaymentPage] = useState(1);

  const [kycSearchDraft, setKycSearchDraft] = useState('');
  const [kycQuery, setKycQuery] = useState({ search: '', status: '' });
  const [kycPage, setKycPage] = useState(1);

  const [error, setError] = useState('');
  const [notice, setNotice] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [confirmAction, setConfirmAction] = useState(null);
  const [actionBusy, setActionBusy] = useState(false);

  const currentUser = getUser();

  useEffect(() => {
    if (!notice) return undefined;

    const timer = window.setTimeout(() => setNotice(null), 4000);
    return () => window.clearTimeout(timer);
  }, [notice]);

  useEffect(() => {
    if (activeTab !== 'overview') return undefined;

    let active = true;
    setDashboardLoading(true);
    setError('');

    adminAPI.getDashboard()
      .then((response) => {
        if (active) setDashboard(response.data);
      })
      .catch((loadError) => {
        if (active) setError(loadError.message || 'Failed to load dashboard');
      })
      .finally(() => {
        if (active) setDashboardLoading(false);
      });

    return () => {
      active = false;
    };
  }, [activeTab, refreshKey]);

  useEffect(() => {
    if (activeTab !== 'users') return undefined;

    let active = true;
    setUsersLoading(true);
    setError('');

    adminAPI.getUsers({ page: userPage, limit: PAGE_SIZE, ...userQuery })
      .then((response) => {
        if (active) {
          setUsers({ data: response.data || [], pagination: response.pagination });
        }
      })
      .catch((loadError) => {
        if (active) setError(loadError.message || 'Failed to load users');
      })
      .finally(() => {
        if (active) setUsersLoading(false);
      });

    return () => {
      active = false;
    };
  }, [activeTab, userPage, userQuery, refreshKey]);

  useEffect(() => {
    if (activeTab !== 'transactions') return undefined;

    let active = true;
    setTransactionsLoading(true);
    setError('');

    adminAPI.getTransactions({ page: transactionPage, limit: PAGE_SIZE, ...transactionQuery })
      .then((response) => {
        if (active) {
          setTransactions({ data: response.data || [], pagination: response.pagination });
        }
      })
      .catch((loadError) => {
        if (active) setError(loadError.message || 'Failed to load transactions');
      })
      .finally(() => {
        if (active) setTransactionsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [activeTab, transactionPage, transactionQuery, refreshKey]);

  useEffect(() => {
    if (activeTab !== 'payments') return undefined;

    let active = true;
    setPaymentsLoading(true);
    setError('');

    adminAPI.getPayments({ page: paymentPage, limit: PAGE_SIZE, ...paymentQuery })
      .then((response) => {
        if (active) {
          setPayments({ data: response.data || [], pagination: response.pagination });
        }
      })
      .catch((loadError) => {
        if (active) setError(loadError.message || 'Failed to load payments');
      })
      .finally(() => {
        if (active) setPaymentsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [activeTab, paymentPage, paymentQuery, refreshKey]);

  useEffect(() => {
    if (activeTab !== 'kyc') return undefined;

    let active = true;
    setKycLoading(true);
    setError('');

    adminAPI.getKYC({ page: kycPage, limit: PAGE_SIZE, ...kycQuery })
      .then((response) => {
        if (active) {
          setKycSubmissions({ data: response.data || [], pagination: response.pagination });
        }
      })
      .catch((loadError) => {
        if (active) setError(loadError.message || 'Failed to load KYC submissions');
      })
      .finally(() => {
        if (active) setKycLoading(false);
      });

    return () => {
      active = false;
    };
  }, [activeTab, kycPage, kycQuery, refreshKey]);

  const openTab = (tab) => {
    const next = new window.URLSearchParams(searchParams);

    if (tab === 'overview') {
      next.delete('tab');
    } else {
      next.set('tab', tab);
    }

    setSearchParams(next, { replace: true });
  };

  const refresh = () => setRefreshKey((key) => key + 1);

  const ask = (title, message, action) => {
    setConfirmAction({ title, message, action });
  };

  const runConfirmedAction = async () => {
    if (!confirmAction) return;

    const pending = confirmAction;
    setConfirmAction(null);
    setActionBusy(true);
    setError('');

    try {
      const message = await pending.action();
      setNotice({ type: 'success', message: message || 'Action completed successfully.' });
      refresh();
    } catch (actionError) {
      setNotice({ type: 'error', message: actionError.message || 'The action could not be completed.' });
    } finally {
      setActionBusy(false);
    }
  };

  const reviewKYC = async (id, decision, reason = '') => {
    try {
      const response = await adminAPI.reviewKYC(id, { decision, reason });
      setNotice({
        type: 'success',
        message: response.message || `KYC submission ${decision === 'approve' ? 'approved' : 'rejected'}.`
      });
      refresh();
      return response;
    } catch (reviewError) {
      setNotice({ type: 'error', message: reviewError.message || 'Could not update this KYC submission.' });
      throw reviewError;
    }
  };

  const toggleAdmin = (user) => {
    const nextValue = !user.isAdmin;
    ask(
      nextValue ? 'Grant admin access?' : 'Remove admin access?',
      nextValue
        ? `${user.fullName} will be able to access this admin console.`
        : `${user.fullName} will lose access to the admin console.`,
      async () => {
        await adminAPI.updateUser(user.id, { isAdmin: nextValue });
        return `${user.fullName} is now ${nextValue ? 'an administrator' : 'a regular user'}.`;
      }
    );
  };

  const toggleKyc = (user) => {
    const nextValue = !user.kycVerified;
    ask(
      nextValue ? 'Verify this user?' : 'Remove KYC verification?',
      nextValue
        ? `Mark ${user.fullName} as KYC verified?`
        : `Mark ${user.fullName} as KYC pending?`,
      async () => {
        await adminAPI.updateUser(user.id, { kycVerified: nextValue });
        return `${user.fullName}'s KYC status was updated.`;
      }
    );
  };

  const toggleActive = (user) => {
    const nextValue = !user.isActive;
    ask(
      nextValue ? 'Reactivate this account?' : 'Suspend this account?',
      nextValue
        ? `${user.fullName} will be able to sign in again.`
        : `${user.fullName} will be signed out and blocked from using Solvent.`,
      async () => {
        await adminAPI.updateUser(user.id, { isActive: nextValue });
        return `${user.fullName}'s account is now ${nextValue ? 'active' : 'suspended'}.`;
      }
    );
  };

  return (
    <div className="app-shell">
      <Sidebar />

      <main className="main-content">
        <TopNavbar title="Admin Console" />

        <div className="admin-page">
          <section className="admin-hero">
            <div>
              <span className="admin-eyebrow">Operations</span>
              <h2>Platform control center</h2>
              <p>Monitor accounts, KYC, transfers, and payments from one place.</p>
            </div>
            <div className="admin-hero-actions">
              <span className="admin-live-badge"><i /> Live data</span>
              <button type="button" className="admin-refresh-button" onClick={refresh} disabled={actionBusy}>
                Refresh
              </button>
            </div>
          </section>

          <nav className="admin-tabs" aria-label="Admin sections" role="tablist">
            {ADMIN_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.id}
                className={activeTab === tab.id ? 'active' : ''}
                onClick={() => openTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </nav>

          {error && <div className="admin-alert error" role="alert">{error}</div>}
          {notice && (
            <div className={`admin-alert ${notice.type}`} role="status">
              {notice.message}
            </div>
          )}

          {activeTab === 'overview' && (
            <OverviewTab dashboard={dashboard} loading={dashboardLoading} onOpenTab={openTab} />
          )}

          {activeTab === 'users' && (
            <UsersTab
              users={users.data}
              pagination={users.pagination}
              loading={usersLoading}
              query={userQuery}
              searchDraft={userSearchDraft}
              onSearchDraftChange={setUserSearchDraft}
              onSearch={(event) => {
                event.preventDefault();
                setUserPage(1);
                setUserQuery((current) => ({ ...current, search: userSearchDraft.trim() }));
              }}
              onFilterChange={(field, value) => {
                setUserPage(1);
                setUserQuery((current) => ({ ...current, [field]: value }));
              }}
              onPageChange={setUserPage}
              currentUserId={currentUser?.id}
              onToggleAdmin={toggleAdmin}
              onToggleKyc={toggleKyc}
              onToggleActive={toggleActive}
            />
          )}

          {activeTab === 'kyc' && (
            <KYCTab
              submissions={kycSubmissions.data}
              pagination={kycSubmissions.pagination}
              loading={kycLoading}
              query={kycQuery}
              searchDraft={kycSearchDraft}
              onSearchDraftChange={setKycSearchDraft}
              onSearch={(event) => {
                event.preventDefault();
                setKycPage(1);
                setKycQuery((current) => ({ ...current, search: kycSearchDraft.trim() }));
              }}
              onFilterChange={(field, value) => {
                setKycPage(1);
                setKycQuery((current) => ({ ...current, [field]: value }));
              }}
              onPageChange={setKycPage}
              onReview={reviewKYC}
            />
          )}

          {activeTab === 'transactions' && (
            <TransactionsTab
              transactions={transactions.data}
              pagination={transactions.pagination}
              loading={transactionsLoading}
              query={transactionQuery}
              searchDraft={transactionSearchDraft}
              onSearchDraftChange={setTransactionSearchDraft}
              onSearch={(event) => {
                event.preventDefault();
                setTransactionPage(1);
                setTransactionQuery((current) => ({ ...current, search: transactionSearchDraft.trim() }));
              }}
              onFilterChange={(field, value) => {
                setTransactionPage(1);
                setTransactionQuery((current) => ({ ...current, [field]: value }));
              }}
              onPageChange={setTransactionPage}
            />
          )}

          {activeTab === 'payments' && (
            <PaymentsTab
              payments={payments.data}
              pagination={payments.pagination}
              loading={paymentsLoading}
              query={paymentQuery}
              searchDraft={paymentSearchDraft}
              onSearchDraftChange={setPaymentSearchDraft}
              onSearch={(event) => {
                event.preventDefault();
                setPaymentPage(1);
                setPaymentQuery((current) => ({ ...current, search: paymentSearchDraft.trim() }));
              }}
              onFilterChange={(field, value) => {
                setPaymentPage(1);
                setPaymentQuery((current) => ({ ...current, [field]: value }));
              }}
              onPageChange={setPaymentPage}
            />
          )}
        </div>
      </main>

      <Dialog open={Boolean(confirmAction)} onClose={() => !actionBusy && setConfirmAction(null)}>
        <DialogTitle>{confirmAction?.title || 'Confirm action'}</DialogTitle>
        <DialogContent>
          <DialogContentText>{confirmAction?.message}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmAction(null)} disabled={actionBusy}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={runConfirmedAction}
            disabled={actionBusy}
            sx={{ bgcolor: '#1a73e8', '&:hover': { bgcolor: '#1765cc' } }}
          >
            {actionBusy ? 'Working...' : 'Confirm'}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default AdminDashboard;
