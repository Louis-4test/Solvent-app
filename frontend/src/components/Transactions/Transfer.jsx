import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import Sidebar, { TopNavbar } from "../Layout/Sidebar";
import { transferFunds, getMyTransactions } from "../../services/transferAPI";
import "../payment/BillPayment.css";
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
    <div className="app-shell">
      <Sidebar />

      <main className="main-content">
        <TopNavbar title="Fund Transfer" />

        <div className="payment-layout">
          <form className="payment-form-card" onSubmit={handleTransfer}>
            <div className="form-tabs">
              <span className="active-tab">Fund Transfer</span>
              <Link to="/merchant-payment">Merchant Pay</Link>
            </div>

            <div className="field">
              <label htmlFor="transfer-type">Transfer Type</label>
              <select
                id="transfer-type"
                value={type}
                onChange={(e) => navigate(`/transfer/${e.target.value}`)}
              >
                {Object.entries(CHANNEL_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>

            <div className="field">
              <label htmlFor="recipient-phone">Recipient Phone Number</label>
              <input
                id="recipient-phone"
                type="text"
                placeholder="6XXXXXXX"
                value={recipientPhone}
                onChange={(e) => setRecipientPhone(e.target.value)}
              />
            </div>

            <div className="field">
              <label htmlFor="transfer-amount">Amount ({CHANNEL_LABELS[type] || type})</label>
              <input
                id="transfer-amount"
                type="number"
                min="0"
                placeholder="Enter Amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>

            <div className="field">
              <label htmlFor="transfer-narration">Narration (optional)</label>
              <input
                id="transfer-narration"
                type="text"
                placeholder="What is this transfer for?"
                value={narration}
                onChange={(e) => setNarration(e.target.value)}
              />
            </div>

            {error && <p className="form-error" role="alert">{error}</p>}
            {message && <p className="form-success" role="status">{message}</p>}

            <div className="form-actions">
              <button type="button" className="back-btn" onClick={() => navigate("/")}>
                {"< Back"}
              </button>
              <button type="submit" className="pay-btn" disabled={loading}>
                {loading ? "Processing..." : "Transfer"}
              </button>
            </div>

            <div className="recent-transfers">
              <h2 className="recent-transfers-title">Recent Transactions</h2>
              <div className="recent-transfers-scroll">
                <table className="recent-transfers-table">
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
          </form>

          <aside className="payment-side" aria-label="Quick actions">
            <div className="side-card">
              <h3>Transfer</h3>
              <Link to="/transfer/bank-to-momo"><button type="button">Bank to Momo</button></Link>
              <Link to="/transfer/momo-to-bank"><button type="button">Momo to Bank</button></Link>
            </div>

            <div className="side-card">
              <h3>Quick Actions</h3>
              <Link to="/bill-payment"><button type="button">Buy Airtime</button></Link>
              <Link to="/bill-payment"><button type="button">Pay Bill</button></Link>
            </div>

            <div className="side-card review-card">
              <h3>Review:</h3>
              <textarea placeholder="Write your review..." rows="5" />
              <p className="rate">Rate: {"\u2B50\u2B50\u2B50\u2B50\u2606"}</p>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
};

export default Transfer;
