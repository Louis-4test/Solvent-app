import React, { useState } from "react";
import { useParams, Link } from "react-router-dom";
import "./Transfer.css";

const Transfer = () => {
  const { type } = useParams(); // Get transfer type from URL params
  const [amount, setAmount] = useState("");

  const handleTransfer = (e) => {
    e.preventDefault();
    alert(`Transferred ${amount} XAF via ${type}`);
  };

  return (
    <div className="container">
      {/* Sidebar */}
      <div className="sidebar">
        <h2>SOLVENT</h2>
        <div className="nav-links">
          <Link to="/">🏠 Home</Link>
          <Link to="/./transactions">💳 Transactions</Link>
          <Link to="/fund-transfer" className="active">💰 Fund Transfer</Link>
          <Link to="/billPayment">📄 Bill Payment</Link>
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
          <h1>Fund Transfer</h1>
          <div className="user-info">
            <span className="card">💰</span>
            <img src="https://via.placeholder.com/40" alt="User" />
          </div>
        </div>

        {/* Fund Transfer Section */}
        <div className="transfer-container">
          <div className="transfer-card">
            <div className="transfer-form">
              <div className="form-tabs">
                <Link to="/transfer/bank-to-momo">
                  <button>Fund Transfer</button>
                </Link>
                <Link to="./payment/MerchantPayment">
                  <button>Merchant Pay</button>
                </Link>
              </div>

              <label>Transfer Type</label>
              <select value={type} enable>
                <option value="bank-to-momo">Bank to Momo</option>
                <option value="momo-to-bank">Momo to Bank</option>
              </select>

              <label>Amount</label>
              <input
                type="number"
                placeholder="Enter Amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />

              <div className="form-actions">
                <button className="back">
                  <Link to="/">⬅️ Back</Link>
                </button>
                <button className="transfer-button" onClick={handleTransfer}>
                  Transfer
                </button>
              </div>
            </div>

            {/* Right Side Actions */}
            <div className="side-actions">
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
                <Link to="./payment/BillPayment">
                  <button>Pay Bill</button>
                </Link>
              </div>

              <div className="quick-actions">
                <p className="quick-actions-title">Review:</p>
                <textarea placeholder="Write your review..." rows="5"></textarea>
                <p className="quick-actions-title">Rate: ⭐⭐⭐☆☆</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Transfer;
