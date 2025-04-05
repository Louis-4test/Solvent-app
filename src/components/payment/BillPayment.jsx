import React from "react";
import { Link } from "react-router-dom";
import "./BillPayment.css";

const BillPayment = () => {
  return (
    <div className="container">
      {/* Sidebar */}
      <div className="sidebar">
        <h2>SOLVENT</h2>
        <div className="nav-links">
          <Link to="/">🏠 Home</Link>
          <Link to="/transactions">💳 Transactions</Link>
          <Link to="/fund-transfer">💰 Fund Transfer</Link>
          <Link to="/bill-payment" className="active">📄 Bill Payment</Link>
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
          <h1>Bill Payment</h1>
          <div className="user-info">
            <span className="card">🛒</span>
            <img src="https://via.placeholder.com/40" alt="User" />
          </div>
        </div>

        {/* Bill Payment Section */}
        <div className="bill-payment-container">
          <div className="bill-form">
            <div className="form-tabs">
              <span className="active-tab">Bill Payment</span>
              <span>Merchant Pay</span>
            </div>

            <label>Service</label>
            <select>
              <option>Electricity</option>
            </select>

            <label>Amount</label>
            <div className="input-group">
              <input type="number" value="8000" readOnly />
              <div className="provider">
                <img src="/om-logo.png" alt="OM" />
                <span>OM</span>
              </div>
            </div>

            <label>Bank/Momo/Wallet Number</label>
            <div className="input-group">
              <input type="text" value="12345678" readOnly />
              <div className="provider">
                <img src="/mtn-logo.png" alt="MTN" />
                <span>MOMO</span>
              </div>
            </div>

            <div className="form-actions">
              <button className="back">Back</button>
              <button className="pay">PAY</button>
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
  );
};

export default BillPayment;
