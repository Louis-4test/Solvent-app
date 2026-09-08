import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import Sidebar, { TopNavbar } from "../Layout/Sidebar";
import { transferFunds, getMyTransactions } from "../../services/transferAPI";
import "./Transfer.css";

const CHANNEL_LABELS = {
  "bank-to-momo": "Bank to Momo",
  "momo-to-bank": "Momo to Bank",
  p2p: "Solvent to Solvent"
};

const Transfer = () => {
  const { type = "bank-to-momo" } = useParams();
  const navigate = useNavigate();
  const [amount, setAmount] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [narration, setNarration] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [recentTransactions, setRecentTransactions] = useState([]);

  useEffect(() => {
    getMyTransactions()
      .then((res) => {
        if (res.success) setRecentTransactions(res.data);
      })
      .catch(() => {});
  }, []);

  const handleTransfer = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!amount || Number(amount) <= 0) {
      setError("Please enter a valid amount.");
      return;
    }
    if (!recipientPhone) {
      setError("Please enter the recipient's phone number.");
      return;
    }

    try {
      setLoading(true);
      const res = await transferFunds({
        recipientPhone,
        amount,
        channel: type,
        narration
      });
      setMessage(res.message || "Transfer completed successfully.");
      setAmount("");
      setRecipientPhone("");
      setNarration("");

      const txns = await getMyTransactions();
      if (txns.success) setRecentTransactions(txns.data);
    } catch (err) {
      setError(err.message || "Transfer failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const formatAmount = (value) => `XAF ${Number(value).toLocaleString()}`;

  return (
    <div className="container">
      <Sidebar />

      {/* Main Content */}
      <div className="main-content">
        <TopNavbar title="Fund Transfer" />

        {/* Fund Transfer Section */}
        <div className="transfer-container">
          <div className="transfer-card">
            <div className="transfer-form">
              <div className="form-tabs">
                <span className="active-tab">Fund Transfer</span>
                <Link to="/merchant-payment">
                  <span>Merchant Pay</span>
                </Link>
              </div>

              <label>Transfer Type</label>
              <select
                value={type}
                onChange={(e) => navigate(`/transfer/${e.target.value}`)}
              >
                {Object.entries(CHANNEL_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>

              <label>Recipient Phone Number</label>
              <input
                type="text"
                placeholder="6XXXXXXX"
                value={recipientPhone}
                onChange={(e) => setRecipientPhone(e.target.value)}
              />

              <label>Amount ({CHANNEL_LABELS[type] || type})</label>
              <input
                type="number"
                placeholder="Enter Amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />

              <label>Narration (optional)</label>
              <input
                type="text"
                placeholder="What is this transfer for?"
                value={narration}
                onChange={(e) => setNarration(e.target.value)}
              />

              {error && <p className="form-error">{error}</p>}
              {message && <p className="form-success">{message}</p>}

              <div className="form-actions">
                <button className="back">
                  <Link to="/">{"\u2B05\uFE0F"} Back</Link>
                </button>
                <button className="transfer-button" onClick={handleTransfer} disabled={loading}>
                  {loading ? "Processing..." : "Transfer"}
                </button>
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
                    {recentTransactions.length === 0 && (
                      <tr><td colSpan="4">No transactions yet.</td></tr>
                    )}
                    {recentTransactions.slice(0, 4).map((tx) => (
                      <tr key={tx.id}>
                        <td>{tx.Recipient?.fullName || tx.Recipient?.phone || "Recipient"}</td>
                        <td>{tx.narration || "Transfer"}</td>
                        <td>{new Date(tx.created_at || tx.createdAt).toLocaleDateString()}</td>
                        <td>{formatAmount(tx.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
                <Link to="/bill-payment">
                  <button>Pay Bill</button>
                </Link>
              </div>

              <div className="quick-actions">
                <p className="quick-actions-title">Review:</p>
                <textarea placeholder="Write your review..." rows="5"></textarea>
                <p className="quick-actions-title">Rate: {"\u2B50\u2B50\u2B50\u2B50\u{2606}"}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Transfer;