import React from "react";
import { Link } from "react-router-dom";
import "./Transactions.css";

const Transactions = () => {
  const transactions = [
    { id: 1, name: "Bank Transfer", time: "15:29", transactionId: "123456789", amount: "12000", status: "Pending" },
    { id: 2, name: "Bank Transfer", time: "15:29", transactionId: "123456789", amount: "12000", status: "Approved" },
    { id: 3, name: "Bank Transfer", time: "15:29", transactionId: "123456789", amount: "12000", status: "Approved" },
    { id: 4, name: "Bank Transfer", time: "15:29", transactionId: "123456789", amount: "12000", status: "Declined" },
    { id: 5, name: "Bank Transfer", time: "15:29", transactionId: "123456789", amount: "12000", status: "Approved" },
  ];

  return (
    <div className="container">
      {/* Sidebar */}
      <div className="sidebar">
        <h2>SOLVENT</h2>
        <div className="nav-links">
          <Link to="/">🏠 Home</Link>
          <Link to="/transactions" className="active">💳 Transactions</Link>
          <Link to="/./transfer/bank-to-momo">💰 Fund Transfer</Link>
          <Link to="/../billPayment">📄 Bill Payment</Link>
          <Link to="/merchant-payment">🏪 Merchant Payment</Link>
          <Link to="/notifications">🔔 Notifications</Link>
          <Link to="/settings">⚙️ Settings</Link>
          <Link to="/logout">🚪 Logout</Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        {/* Top Navbar */}
        <div className="navbar">
          <h1>Dashboard</h1>
          <div className="user-info">
            <span className="card">🛒</span>
            <img src="https://via.placeholder.com/40" alt="User" />
          </div>
        </div>

        {/* Account Balance */}
        <div className="account-balance">XAF 230,000</div>
        <div className="wallet-balance">Wallet Balance: XAF 78,500</div>

          <div className="trans">
            {/* Send Money Form */}
            <div className="send-money-form">
            <h3>Send Money</h3>
            <label>Enter the Amount</label>
            <input type="number" placeholder="Amount" />
            <label>Bank/Momo/Wallet Number</label>
            <input type="text" placeholder="123456789" />
            <button>Send</button>
            </div>

            {/* Transactions */}
            <div className="transactions-container">
            <div className="transactions-header">
                <h2>Past Transactions</h2>
                <span className="export-csv">+ Export CSV</span>
            </div>

            <div className="transactions-tabs">
                <span className="active-tab">Past Transactions</span>
                <span>Standing Order</span>
            </div>

              <div className="transactions-list">
                  {transactions.map((transaction) => (
                    <div key={transaction.id} className="transaction-item">
                        <span className="transaction-icon">⬇️</span>
                        <div className="transaction-details">
                        <div className="transaction-name">{transaction.name}</div>
                        <div className="transaction-time">{transaction.time}</div>
                        </div>
                        <div className="transaction-id">ID {transaction.transactionId}</div>
                        <div className="transaction-amount">{transaction.amount}</div>
                        <div className={`transaction-status ${transaction.status.toLowerCase()}`}>{transaction.status}</div>
                    </div>
                  ))}
              </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Transactions;
