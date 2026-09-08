import { useEffect, useState } from "react";
import { getMyTransactions } from "../../services/transferAPI";
import Sidebar, { TopNavbar } from "../Layout/Sidebar";
import "./Transactions.css";

const FALLBACK_TRANSACTIONS = [
  { id: 1, name: "Bank Transfer", time: "15:29", transactionId: "123456789", amount: "12000", status: "Pending" },
  { id: 2, name: "Bank Transfer", time: "15:29", transactionId: "123456789", amount: "12000", status: "Approved" },
  { id: 3, name: "Bank Transfer", time: "15:29", transactionId: "123456789", amount: "12000", status: "Approved" },
  { id: 4, name: "Bank Transfer", time: "15:29", transactionId: "123456789", amount: "12000", status: "Declined" },
  { id: 5, name: "Bank Transfer", time: "15:29", transactionId: "123456789", amount: "12000", status: "Approved" },
];

const statusLabel = (status) => {
  const map = { pending: "Pending", completed: "Approved", failed: "Declined", reversed: "Reversed" };
  return map[status] || status;
};

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyTransactions()
      .then((res) => {
        if (res.success) {
          setTransactions(res.data);
        }
      })
      .catch((err) => {
        console.warn('Could not load transactions:', err.message);
        setTransactions(FALLBACK_TRANSACTIONS);
      })
      .finally(() => setLoading(false));
  }, []);

  const displayTransactions = transactions.length > 0 ? transactions.map((t) => ({
    id: t.id,
    name: `${t.Sender?.fullName || "Transfer"} \u2192 ${t.Recipient?.fullName || "Account"}`,
    time: new Date(t.created_at || t.createdAt).toLocaleString(),
    transactionId: t.reference || `TXN-${t.id}`,
    amount: `XAF ${Number(t.amount).toLocaleString()}`,
    status: statusLabel(t.status)
  })) : FALLBACK_TRANSACTIONS;

  return (
    <div className="container">
      <Sidebar />

      {/* Main Content */}
      <div className="main-content">
        <TopNavbar title="Transactions" />

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
              {loading && <p>Loading transactions...</p>}
              {!loading && displayTransactions.map((transaction) => (
                <div key={transaction.id} className="transaction-item">
                  <span className="transaction-icon">{"\u2B07\uFE0F"}</span>
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