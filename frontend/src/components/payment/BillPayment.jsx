import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Sidebar, { TopNavbar } from "../Layout/Sidebar";
import { payBill } from "../../services/paymentAPI";
import "./BillPayment.css";

const SERVICES = ["Electricity", "Water", "Airtime", "Internet", "TV"];

const BillPayment = () => {
  const navigate = useNavigate();
  const [service, setService] = useState(SERVICES[0]);
  const [amount, setAmount] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handlePay = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!amount || Number(amount) <= 0) {
      setError("Please enter a valid amount.");
      return;
    }
    if (!accountNumber) {
      setError("Please enter your account/customer number.");
      return;
    }

    try {
      setLoading(true);
      const res = await payBill({ amount, service, accountNumber });
      setMessage(res.message || "Payment completed successfully.");
      setAmount("");
      setAccountNumber("");
    } catch (err) {
      setError(err.message || "Payment failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-shell">
      <Sidebar />

      <main className="main-content">
        <TopNavbar title="Bill Payment" />

        <div className="payment-layout">
          <form className="payment-form-card" onSubmit={handlePay}>
            <div className="form-tabs" role="tablist" aria-label="Payment type">
              <Link to="/bill-payment" className="active-tab" role="tab" aria-selected="true">Bill Payment</Link>
              <Link to="/merchant-payment" role="tab" aria-selected="false">Merchant Pay</Link>
            </div>

            <div className="field">
              <label htmlFor="service">Service</label>
              <select id="service" value={service} onChange={(e) => setService(e.target.value)}>
                {SERVICES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>

            <div className="field">
              <label htmlFor="amount">Amount</label>
              <input
                id="amount"
                type="number"
                min="0"
                placeholder="8000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>

            <div className="field">
              <label htmlFor="accountNumber">Bank/Momo/Wallet Number</label>
              <input
                id="accountNumber"
                type="text"
                placeholder="12345678"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
              />
            </div>

            {error && <p className="form-error" role="alert">{error}</p>}
            {message && <p className="form-success" role="status">{message}</p>}

            <div className="form-actions">
              <button type="button" className="back-btn" onClick={() => navigate("/")}>{"< Back"}</button>
              <button type="submit" className="pay-btn" disabled={loading}>
                {loading ? "Processing..." : "PAY"}
              </button>
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
              <textarea placeholder="Write your review..." rows="4" />
              <p className="rate">Rate: {"\u2B50\u2B50\u2B50\u2B50\u2606"}</p>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
};

export default BillPayment;
