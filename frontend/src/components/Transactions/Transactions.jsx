import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import "./Transactions.css";

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [amount, setAmount] = useState("");
  const [recipient, setRecipient] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch transactions from backend
  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const response = await axios.get("http://localhost:3001/api/transactions");
        setTransactions(response.data);
      } catch (err) {
        setError("Failed to load transactions");
        console.error("Error fetching transactions:", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchTransactions();
  }, []);

  // Handle sending money
  const handleSendMoney = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post("http://localhost:3001/api/transactions", {
        amount,
        recipient
      });
      
      // Add new transaction to the list
      setTransactions([response.data, ...transactions]);
      setAmount("");
      setRecipient("");
      
      alert("Transaction successful!");
    } catch (err) {
      alert("Transaction failed: " + (err.response?.data?.message || err.message));
      console.error("Transaction error:", err);
    }
  };

  if (loading) return <div className="container">Loading transactions...</div>;
  if (error) return <div className="container">{error}</div>;

  return (
    <div className="container">
      {/* Sidebar remains unchanged */}
      <div className="sidebar">
        {/* ... existing sidebar code ... */}
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

        {/* Account Balance - Consider fetching this from API */}
        <div className="account-balance">XAF 230,000</div>
        <div className="wallet-balance">Wallet Balance: XAF 78,500</div>

        <div className="trans">
          {/* Send Money Form */}
          <form className="send-money-form" onSubmit={handleSendMoney}>
            <h3>Send Money</h3>
            <label>Enter the Amount</label>
            <input 
              type="number" 
              placeholder="Amount" 
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
            <label>Bank/Momo/Wallet Number</label>
            <input 
              type="text" 
              placeholder="123456789" 
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              required
            />
            <button type="submit">Send</button>
          </form>

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
                  <span className="transaction-icon">
                    {transaction.type === 'deposit' ? '⬆️' : '⬇️'}
                  </span>
                  <div className="transaction-details">
                    <div className="transaction-name">
                      {transaction.type === 'transfer' 
                        ? `Transfer to ${transaction.recipient_name || transaction.recipient_id}`
                        : transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                    </div>
                    <div className="transaction-time">
                      {new Date(transaction.createdAt).toLocaleTimeString()}
                    </div>
                  </div>
                  <div className="transaction-id">ID {transaction.reference}</div>
                  <div className="transaction-amount">
                    {transaction.amount} {transaction.currency || 'XAF'}
                  </div>
                  <div className={`transaction-status ${transaction.status.toLowerCase()}`}>
                    {transaction.status}
                  </div>
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