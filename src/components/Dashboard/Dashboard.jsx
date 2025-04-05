import React from "react";
import { Link } from "react-router-dom";
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import "./Dashboard.css";

const Dashboard = () => {
  const data = [
    { date: "3 Apr", income: 2000, expenses: 8000 },
    { date: "4 Apr", income: 4000, expenses: 6000 },
    { date: "5 Apr", income: 6000, expenses: 5000 },
    { date: "6 Apr", income: 8000, expenses: 4000 },
    { date: "7 Apr", income: 10000, expenses: 6000 },
  ];

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <div className="sidebar">
        <h1 className="logo">SOLVENT</h1>
        <nav>
          <Link to="/">🏠 Home</Link>
          <Link to="/transactions">📜 Transactions</Link>
          <Link to="/transfer/bank-to-momo">💳 Fund Transfer</Link>
          <Link to="/payment/billPayment">📑 Bill Payment</Link>
          <Link to="/payment/merchantPayment">📑 Merchant Payment</Link>
          <Link to="/notifications">🔔 Notifications</Link>
          <Link to="/settings">⚙️ Settings</Link>
          <Link to="/logout" className="logout">🚪 Logout</Link>
        </nav>
      </div>

      {/* Main Section */}
      <div className="main-section">
        {/* Content Section */}
        <div className="content-section">
          
          <div className="navbar">
            <h1>Dashboard</h1>
            <div className="user-info">
              <span className="card">🛒</span>
              <img src="https://via.placeholder.com/40" alt="User" />
            </div>
          </div>

          <div className="trans">
            <div className="content-section">
              {/* Account Balances (Flex in Row) */}
            <div className="account-balances">
              {["Bank", "Momo", "Wallet", "Expenses"].map((type, index) => (
                <div key={index} className="balance-card">
                  <p className="balance-type">{type}</p>
                  <h2 className="balance-amount">XAF {Math.floor(Math.random() * 90000)}</h2>
                </div>
              ))}
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
                  <tr>
                    <td>Mobile Money</td>
                    <td>Food</td>
                    <td>March 08, 2025</td>
                    <td>XAF 6500</td>
                  </tr>
                  <tr>
                    <td>Bank Transfer</td>
                    <td>Bank to Momo</td>
                    <td>March 07, 2025</td>
                    <td>XAF 45000</td>
                  </tr>
                  <tr>
                    <td>Bill Payment</td>
                    <td>Electric Bill</td>
                    <td>March 04, 2025</td>
                    <td>XAF 23000</td>
                  </tr>
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
                <button>Add Money</button>
                <button>Pay Bill</button>
              </div>

              <div className="quick-actions">
                <h3 className="quick-actions-title">Quick Actions</h3>
                <button>Add Money</button>
                <button>Pay Bill</button>
              </div>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
