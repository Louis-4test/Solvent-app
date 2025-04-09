import React from "react";
import { Link } from "react-router-dom";
import "./MerchantPayment.css";

const MerchantPayment = () => {
  return (
    <div className="container">
      {/* Sidebar */}
      <div className="sidebar">
        <h2>SOLVENT</h2>
        <div className="nav-links">
          <Link to="/">🏠 Home</Link>
          <Link to="/transactions">💳 Transactions</Link>
          <Link to="/./transfer/bank-to-momo">💰 Fund Transfer</Link>
          <Link to="/./billpayment">📄 Bill Payment</Link>
          <Link to="/merchant-payment" className="active">🏪 Merchant Payment</Link>
          <Link to="/notifications">🔔 Notifications</Link>
          <Link to="/settings">⚙️ Settings</Link>
          <Link to="/logout">🚪 Logout</Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        {/* Navbar */}
        <div className="navbar">
          <h1>Merchant Pay</h1>
          <div className="user-info">
            <span className="card">🛒</span>
            <img src="https://via.placeholder.com/40" alt="User" />
          </div>
        </div>

        <div className="merchant-container">
          {/* Left Side: Payment Methods */}
          <div className="merchant-box">
            <div className="merchant-tabs">
              <span className="active-tab">Merchant Pay</span>
              <span>Bill Payment</span>
            </div>

            <div className="payment-method">
              <span>Orange Money</span>
              <img src="/orange.png" alt="OM" />
              <span>***4342</span>
            </div>

            <div className="payment-method">
              <span>Mobile Money</span>
              <img src="/mtn.png" alt="MTN" />
              <span>***2414</span>
            </div>

            <div className="payment-method">
              <span>Wallets Pay</span>
              <img src="/wallet.png" alt="Wallet" />
              <span>***0473</span>
            </div>

            <div className="payment-method">
              <span>Pay by Bank</span>
              <img src="/bank.png" alt="Bank" />
              <span>***0786</span>
            </div>

            <div className="button-group">
              <button className="back-btn">← Back</button>
              <button className="pay-btn">PAY</button>
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

          {/* Right Side: QR + Review */}
          <div className="merchant-sidebar">
            <div className="qr-box">
              <h4>Pay by Phone?<br />Scan QR Code</h4>
              <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=merchant123" alt="QR Code" />
            </div>

            <div className="review-box">
              <label>Review:</label>
              <textarea placeholder="Leave a comment..." />
              <div className="rating">
                Rate:
                <span>⭐</span><span>⭐</span><span>⭐</span><span>⭐</span><span>⭐</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MerchantPayment;
