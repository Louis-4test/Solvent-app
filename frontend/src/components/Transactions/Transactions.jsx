import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getMyTransactions, transferFunds } from "../../services/transferAPI";
import Sidebar, { TopNavbar } from "../Layout/Sidebar";
import "./Transactions.css";

const FALLBACK_TRANSACTIONS = [
  { id: 1, name: "Bank Transfer", time: "15:29", transactionId: "123456789", amount: "12000", status: "Pending" },
  { id: 2, name: "Bank Transfer", time: "15:29", transactionId: "123456789", amount: "12000", status: "Approved" },
  { id: 3, name: "Bank Transfer", time: "15:29", transactionId: "123456789", amount: "12000", status: "Approved" },
  { id: 4, name: "Bank Transfer", time: "15:29", transactionId: "123456789", amount: "12000", status: "Declined" },
  { id: 5, name: "Bank Transfer", time: "15:29", transactionId: "123456789", amount: "12000", status: "Approved" }
];

const statusLabel = (status) => {
  const map = { pending: "Pending", completed: "Approved", failed: "Declined", reversed: "Reversed" };
  return map[status] || status;
};

const formatTxn = (t, withReceipt = false) => ({
  id: t.id,
  name: `${t.Sender?.fullName || "Transfer"} \u2192 ${t.Recipient?.fullName || "Account"}`,
  time: new Date(t.created_at || t.createdAt).toLocaleString(),
  transactionId: t.reference || `TXN-${t.id}`,
  amount: `XAF ${Number(t.amount).toLocaleString()}`,
  status: statusLabel(t.status),
  receiptLink: withReceipt && t.reference
    ? `/receipts/${encodeURIComponent(t.reference)}`
    : null
});

const Transactions = () => {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadTransactions = () => {
    setLoading(true);
    getMyTransactions()
      .then((res) => {
        if (res.success) setTransactions(res.data);
      })
      .catch((err) => {
        console.warn("Could not load transactions:", err.message);
        setTransactions(FALLBACK_TRANSACTIONS);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadTransactions();
  }, []);

  const usingLiveData = transactions.length > 0;
  const displayTransactions = usingLiveData
    ? transactions.map((transaction) => formatTxn(transaction, true))
    : FALLBACK_TRANSACTIONS;

  const handleQuickSend = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!amount || Number(amount) <= 0) {
      setError("Please enter a valid amount.");
      return;
    }
    if (!recipientPhone) {
      setError("Please enter a recipient phone number.");
      return;
    }

    try {
      setSending(true);
      const res = await transferFunds({ recipientPhone, amount, channel: "p2p" });
      setMessage(res.message || "Transfer completed successfully.");
      setAmount("");
      setRecipientPhone("");
      loadTransactions();
    } catch (err) {
      setError(err.message || "Transfer failed. Please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="app-shell">
      <Sidebar />

      <main className="main-content">
        <TopNavbar title="Dashboard" />

        <section className="balance-summary" aria-label="Account balance">
          <h2>XAF 230,000</h2>
          <p>Total Balance</p>
        </section>

        <div className="transactions-layout">
          <form className="send-money-form" onSubmit={handleQuickSend}>
            <div className="send-form-tabs">
              <span className="active">Send Money</span>
              <Link to="/merchant-payment">Merchant Pay</Link>
            </div>

            <p className="send-form-heading">Enter the Amount</p>
            <p className="transfer-charge">Transfer Charges rate 2%</p>

            <label htmlFor="quick-amount">Amount</label>
            <input
              id="quick-amount"
              type="number"
              min="0"
              placeholder="8000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />

            <label htmlFor="quick-phone">Bank/Momo/Wallet Number</label>
            <input
              id="quick-phone"
              type="text"
              placeholder="123456789"
              value={recipientPhone}
              onChange={(e) => setRecipientPhone(e.target.value)}
            />

            {error && <p className="form-error" role="alert">{error}</p>}
            {message && <p className="form-success" role="status">{message}</p>}

            <div className="send-actions">
              <button type="button" className="send-back" onClick={() => navigate("/")}>{"< Back"}</button>
              <button type="submit" className="send-btn" disabled={sending}>
                {sending ? "Sending..." : "Send"}
              </button>
            </div>

            <div className="wallet-summary">
              <span>Wallet Balance</span>
              <strong>XAF 78,500</strong>
            </div>
          </form>

          <section className="transactions-container">
            <div className="transactions-header">
              <h2>Past Transactions</h2>
              <button type="button" className="export-csv">+ Export CSV</button>
            </div>

            <div className="transactions-tabs">
              <span className="active-tab">Past Transactions</span>
              <span>Standing Order</span>
            </div>

            <div className="transactions-list">
              {loading && <p className="transactions-empty">Loading transactions...</p>}
              {!loading && displayTransactions.map((transaction) => (
                <div key={transaction.id} className="transaction-item">
                  <span className="transaction-icon" aria-hidden="true">{"\u2193"}</span>
                  <div className="transaction-details">
                    <div className="transaction-name">{transaction.name}</div>
                    <div className="transaction-time">{transaction.time}</div>
                  </div>
                  {transaction.receiptLink ? (
                    <Link className="transaction-id transaction-receipt-link" to={transaction.receiptLink}>
                      Receipt · {transaction.transactionId}
                    </Link>
                  ) : (
                    <div className="transaction-id">ID {transaction.transactionId}</div>
                  )}
                  <div className="transaction-amount">{transaction.amount}</div>
                  <div className={`transaction-status ${transaction.status.toLowerCase()}`}>{transaction.status}</div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default Transactions;
