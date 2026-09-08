import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
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
  ];

  const [recentTransactions, setRecentTransactions] = useState([]);
  const [balances] = useState({ bank: 45000, momo: 23500, wallet: 8200 });
  const [user] = useState(getUser());

  useEffect(() => {
    getMyTransactions()
      .then((res) => {
        if (res.success && res.data.length > 0) {
          setRecentTransactions(res.data);
        }
      })
      .catch((err) => {
        console.warn('Could not load transactions:', err.message);
      });
  }, []);

  const displayTransactions = recentTransactions.length > 0 ? recentTransactions : FALLBACK_TRANSACTIONS;

  const formatAmount = (amount) => `XAF ${Number(amount).toLocaleString()}`;

  const getCounterparty = (tx) => {
    const userId = user?.id;
    return tx.Sender?.id === userId ? (tx.Recipient?.fullName || "Recipient") : (tx.Sender?.fullName || "Sender");
  };

  return (
    <div className="dashboard-container">
      <Sidebar />

      {/* Main Section */}
      <div className="main-section">
        {/* Content Section */}
        <div className="content-section">

          <TopNavbar title="Dashboard" />

          {!user?.kycVerified && (
            <div className="kyc-banner">
              <span>{"\u26A0\uFE0F"} Your account is not KYC verified yet.</span>
              <Link to="/settings">Verify now</Link>
            </div>
          )}

          <div className="trans">
            <div className="content-section">
              {/* Account Balances (Flex in Row) */}
              <div className="account-balances">
                <div className="balance-card">
                  <p className="balance-type">Bank</p>
                  <h2 className="balance-amount">{formatAmount(balances.bank)}</h2>
                </div>
                <div className="balance-card">
                  <p className="balance-type">Momo</p>
                  <h2 className="balance-amount">{formatAmount(balances.momo)}</h2>
                </div>
                <div className="balance-card">
                  <p className="balance-type">Wallet</p>
                  <h2 className="balance-amount">{formatAmount(balances.wallet)}</h2>
                </div>
                <div className="balance-card">
                  <p className="balance-type">Expenses</p>
                  <h2 className="balance-amount">{formatAmount(recentTransactions.reduce((sum, t) => sum + Number(t.amount || 0), 0))}</h2>
                </div>
              </div>

              {/* Finance Chart */}
              <div className="finance-chart">
                <h2 className="chart-title">Finances</h2>
                <LineChart width={600} height={300} data={data}>
                  <XAxis dataKey="date" />
                  <YAxis />
                  <CartesianGrid strokeDasharray="3 3" />
                  <Tooltip />
                  <Line type="monotone" dataKey="income" stroke="#3b82f6" />
                  <Line type="monotone" dataKey="expenses" stroke="#ef4444" />
                </LineChart>
              </div>

              {/* Recent Transactions */}
              <div className="recent-transactions">
                <h2 className="transactions-title">Recent Transactions</h2>
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
                        <td>{formatAmount(tx.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Quick Actions Section (At Right) */}
            <div className="quick-actions-section">
              <div className="quick-actions">
                <h3 className="quick-actions-title">Transfer</h3>
                <Link to="/transfer/bank-to-momo">
                  <button>Bank to Momo</button>
                </Link>
                <Link to="/transfer/momo-to-bank">
                  <button>Momo to Bank</button>
                </Link>
              </div>

              <div className="quick-actions">
                <h3 className="quick-actions-title">Quick Actions</h3>
                <Link to="/transfer/airtime">
                  <button>Buy Airtime</button>
                </Link>
                <Link to="/bill-payment">
                  <button>Pay Bill</button>
                </Link>
              </div>

              <div className="quick-actions">
                <h3 className="quick-actions-title">Quick Actions</h3>
                <Link to="/transfer/bank-to-momo">
                  <button>Add Money</button>
                </Link>
                <Link to="/merchant-payment">
                  <button>Pay Merchant</button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;