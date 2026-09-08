import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Sidebar, { TopNavbar } from "../Layout/Sidebar";
import { payMerchant } from "../../services/paymentAPI";
import "./MerchantPayment.css";

const MerchantPayment = () => {
  const navigate = useNavigate();
  const [amount, setAmount] = useState("");
  const [merchant, setMerchant] = useState("Merchant");
  const [paymentMethod, setPaymentMethod] = useState("mobile_money");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [qrScanned, setQrScanned] = useState(false);

  const handlePay = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!amount || Number(amount) <= 0) {
      setError("Please enter a valid amount.");
      return;
    }
    if (!qrScanned) {
      setError("Please scan the merchant QR code first.");
      return;
    }

    try {
      setLoading(true);
      const res = await payMerchant({ amount, merchant, payment_method: paymentMethod });
      setMessage(res.message || "Merchant payment successful.");
      setAmount("");
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
        <TopNavbar title="Merchant Pay" />

        <div className="merchant-container">
          {/* Left Side: Payment Methods */}
          <form className="merchant-box" onSubmit={handlePay}>
            <div className="merchant-tabs">
              <span className="active-tab">Merchant Pay</span>
              <Link to="/bill-payment">
                <span>Bill Payment</span>
              </Link>
            </div>

            <label>Merchant</label>
            <input
              type="text"
              value={merchant}
              onChange={(e) => setMerchant(e.target.value)}
              placeholder="Merchant name"
            />

            <label>Amount (XAF)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
            />

            <label>Payment Method</label>
            <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
              <option value="mobile_money">Mobile Money</option>
              <option value="bank_transfer">Pay by Bank</option>
              <option value="card">Card</option>
            </select>

            {error && <p className="form-error" style={{ color: "red", marginTop: 10 }}>{error}</p>}
            {message && <p className="form-success" style={{ color: "green", marginTop: 10 }}>{message}</p>}

            <div className="button-group">
              <button type="button" className="back-btn" onClick={() => navigate("/")}>{"\u2190"} Back</button>
              <button type="submit" className="pay-btn" disabled={loading}>
                {loading ? "Processing..." : "PAY"}
              </button>
            </div>
          </form>

          {/* Right Side: QR + Review */}
          <div className="merchant-sidebar">
            <div className="qr-box">
              <h4>Pay by Phone?<br />Scan QR Code</h4>
              <img
                src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=merchant123"
                alt="QR Code"
                onClick={() => setQrScanned(true)}
                style={{ cursor: "pointer", border: qrScanned ? "3px solid green" : "3px solid transparent" }}
                title="Click to simulate scanning"
              />
              {qrScanned && <p style={{ color: "green", marginTop: 8 }}>QR code scanned!</p>}
            </div>

            <div className="review-box">
              <label>Review:</label>
              <textarea placeholder="Leave a comment..." />
              <div className="rating">
                Rate:
                <span>{"\u2B50"}</span><span>{"\u2B50"}</span><span>{"\u2B50"}</span><span>{"\u2B50"}</span><span>{"\u{2606}"}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MerchantPayment;