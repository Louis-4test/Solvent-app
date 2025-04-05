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
          <Link to="/transactions">💳 Transactions</Link>
          <Link to="/fund-transfer" className="active">💰 Fund Transfer</Link>
          <Link to="/bill-payment">📄 Bill Payment</Link>
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
                <span className="active-tab">Fund Transfer</span>
                <span>Merchant Pay</span>
              </div>

              <label>Transfer Type</label>
              <select value={type} disabled>
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
              <div className="box">
                <h4>Transfer</h4>
                <button>Bank to Momo</button>
                <button>Momo to Bank</button>
              </div>

              <div className="box">
                <button>Buy Airtime</button>
                <button>Pay Bill</button>
              </div>

              <div className="box">
                <p>Review:</p>
                <textarea placeholder="Write your review..." rows="3"></textarea>
                <p>Rate: ⭐⭐⭐☆☆</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Transfer;
