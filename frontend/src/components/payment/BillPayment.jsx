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
    <div className="container">
      <Sidebar />

      {/* Main Content */}
      <div className="main-content">
        <TopNavbar title="Bill Payment" />

        {/* Bill Payment Section */}
        <div className="bill-payment-container">
          <form className="bill-form" onSubmit={handlePay}>
            <div className="form-tabs">
              <span className="active-tab">Bill Payment</span>
              <Link to="/merchant-payment">
                <span>Merchant Pay</span>
              </Link>
            </div>

            <label>Service</label>
            <select value={service} onChange={(e) => setService(e.target.value)}>
              {SERVICES.map((s) => <option key={s}>{s}</option>)}
            </select>

            <label>Amount (XAF)</label>
            <div className="input-group">
              <input
                type="number"
                placeholder="Enter Amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>

            <label>{service} Account / Meter Number</label>
            <div className="input-group">
              <input
                type="text"
                placeholder={"Enter your " + service.toLowerCase() + " account"}
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
              />
            </div>

            {error && <p className="form-error" style={{ color: "red", marginTop: 10 }}>{error}</p>}
            {message && <p className="form-success" style={{ color: "green", marginTop: 10 }}>{message}</p>}

            <div className="form-actions">
              <button type="button" className="back" onClick={() => navigate("/")}>Back</button>
              <button type="submit" className="pay" disabled={loading}>
                {loading ? "Processing..." : "PAY"}
              </button>
            </div>
          </form>

          {/* Right Side Actions */}
          <div className="side-actions">
            <div className="box">
              <h4>Transfer</h4>
              <Link to="/transfer/bank-to-momo"><button>Bank to Momo</button></Link>
              <Link to="/transfer/momo-to-bank"><button>Momo to Bank</button></Link>
            </div>

            <div className="box">
              <Link to="/transfer/airtime"><button>Buy Airtime</button></Link>
              <Link to="/bill-payment"><button>Pay Bill</button></Link>
            </div>

            <div className="box">
              <p>Review:</p>
              <textarea placeholder="Write your review..." rows="3"></textarea>
              <p>Rate: {"\u2B50\u2B50\u2B50\u2B50\u{2606}"}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BillPayment;