import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from "recharts";
import Sidebar, { TopNavbar } from "../Layout/Sidebar";
import { getMyTransactions } from "../../services/transferAPI";
import { getUser } from "../../utils/auth";
import "./Dashboard.css";

const FALLBACK_TRANSACTIONS = [
  { id: 1, narration: "Mobile Money", type: "Food", created_at: "March 08, 2025", amount: 6500 },
  { id: 2, narration: "Bank Transfer", type: "Bank to Momo", created_at: "March 07, 2025", amount: 45000 },
  { id: 3, narration: "Bill Payment", type: "Electric Bill", created_at: "March 04, 2025", amount: 23000 }
];

const Dashboard = () => {
  const data = [
    { date: "3 Apr", income: 2000, expenses: 8000 },
    { date: "4 Apr", income: 4000, expenses: 6000 },
    { date: "5 Apr", income: 6000, expenses: 5000 },
    { date: "6 Apr", income: 8000, expenses: 4000 },
    { date: "7 Apr", income: 10000, expenses: 6000 },
    { date: "8 Apr", income: 7000, expenses: 3000 }
  ];

  const [recentTransactions, setRecentTransactions] = useState([]);
  const [balances] = useState({ bank: 89000, momo: 32000, wallet: 5700 });
  const [user] = useState(getUser());

  useEffect(() => {
    getMyTransactions()
      .then((res) => {
        if (res.success && res.data.length > 0) {
          setRecentTransactions(res.data);
        }
      })
      .catch((err) => {
        console.warn("Could not load transactions:", err.message);
      });
  }, []);

  const displayTransactions = recentTransactions.length > 0 ? recentTransactions : FALLBACK_TRANSACTIONS;

  const formatAmount = (amount) => `XAF ${Number(amount).toLocaleString()}`;

  const getCounterparty = (tx) => {
    const userId = user?.id;
    if (tx.Sender?.id === userId) return tx.Recipient?.fullName || "Recipient";
    if (tx.Recipient?.id === userId) return tx.Sender?.fullName || "Sender";
    return tx.narration || tx.Sender?.fullName || tx.Recipient?.fullName || "Transaction";
  };

  const totalExpenses = recentTransactions.reduce((sum, t) => sum + Number(t.amount || 0), 0) || 5400;

  return (
    <div className="app-shell">
      <Sidebar />

      <main className="main-content">
        <TopNavbar title="Dashboard" variant="muted" />

        {!user?.kycVerified && (
          <div className="kyc-banner">
            <span>{"\u26A0\uFE0F"} Your account is not KYC verified yet.</span>
            <Link to="/settings">Verify now</Link>
          </div>
        )}

        <div className="dashboard-grid">
          <div className="dashboard-primary">
            <section className="account-balances" aria-label="Account balances">
              <article className="balance-card">
                <p className="balance-type">Bank</p>
                <h2 className="balance-amount">{formatAmount(balances.bank)}</h2>
                <p className="balance-label">Balance</p>
              </article>
              <article className="balance-card">
                <p className="balance-type">Momo</p>
                <h2 className="balance-amount">{formatAmount(balances.momo)}</h2>
                <p className="balance-label">Balance</p>
              </article>
              <article className="balance-card">
                <p className="balance-type">Wallet</p>
                <h2 className="balance-amount">{formatAmount(balances.wallet)}</h2>
                <p className="balance-label">Balance</p>
              </article>
              <article className="balance-card">
                <p className="balance-type">Expenses</p>
                <h2 className="balance-amount">{formatAmount(totalExpenses)}</h2>
                <p className="balance-label">This month</p>
              </article>
            </section>

            <section className="finance-chart page-card">
              <div className="card-heading">
                <h2 className="chart-title">Finances</h2>
                <div className="chart-legend" aria-hidden="true">
                  <span><i className="legend-dot legend-income" /> Income</span>
                  <span><i className="legend-dot legend-expenses" /> Expenses</span>
                </div>
              </div>
              <div className="chart-wrapper">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data} margin={{ top: 12, right: 12, left: -16, bottom: 0 }}>
                    <CartesianGrid stroke="#E5E7EB" strokeDasharray="3 5" vertical={false} />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: "#64748B", fontSize: 12 }} />
                    <YAxis
                      width={56}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#64748B", fontSize: 12 }}
                      tickFormatter={(value) => `XAF${value / 1000}k`}
                    />
                    <Tooltip
                      formatter={(value) => [`XAF ${Number(value).toLocaleString()}`, ""]}
                      contentStyle={{ borderRadius: 10, border: "1px solid #E5E7EB", fontSize: 13 }}
                    />
                    <Line type="monotone" dataKey="income" name="Income" stroke="#1A73E8" strokeWidth={2.5} dot={false} activeDot={{ r: 5 }} />
                    <Line type="monotone" dataKey="expenses" name="Expenses" stroke="#EF4444" strokeWidth={2.5} dot={false} activeDot={{ r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </section>

            <section className="recent-transactions page-card">
              <div className="card-heading">
                <h2 className="transactions-title">Recent Transactions</h2>
                <Link to="/transactions" className="card-link">View all</Link>
              </div>
              <div className="table-scroll">
                <table className="transactions-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Type</th>
                      <th>Date</th>
                      <th>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayTransactions.slice(0, 4).map((tx) => (
                      <tr key={tx.id}>
                        <td>{getCounterparty(tx)}</td>
                        <td>{tx.narration || tx.type || "Payment"}</td>
                        <td>{new Date(tx.created_at || tx.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "2-digit" })}</td>
                        <td className="amount-cell">{formatAmount(tx.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>

          <aside className="dashboard-aside" aria-label="Quick actions">
            <div className="quick-actions">
              <h3 className="quick-actions-title">Transfer</h3>
              <Link to="/transfer/bank-to-momo"><button type="button">Bank to Momo</button></Link>
              <Link to="/transfer/momo-to-bank"><button type="button">Momo to Bank</button></Link>
            </div>

            <div className="quick-actions">
              <h3 className="quick-actions-title">Quick Actions</h3>
              <Link to="/transfer/bank-to-momo"><button type="button">Add Money</button></Link>
              <Link to="/bill-payment"><button type="button">Pay Bill</button></Link>
            </div>

            <div className="quick-actions quick-actions-empty" aria-hidden="true" />
          </aside>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
