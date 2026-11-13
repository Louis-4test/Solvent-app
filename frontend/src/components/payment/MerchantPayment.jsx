import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Sidebar, { TopNavbar } from "../Layout/Sidebar";
import { payMerchant } from "../../services/paymentAPI";
import "./BillPayment.css";
import "./MerchantPayment.css";

const PAYMENT_METHODS = [
  { id: "orange", label: "Orange Money", mask: "***4342", color: "#ff7900", initials: "OM", apiValue: "mobile_money" },
  { id: "mobile", label: "Mobile Money", mask: "***2414", color: "#f4c20d", initials: "MM", apiValue: "mobile_money" },
  { id: "wallet", label: "Wallets Pay", mask: "***0473", color: "#1a73e8", initials: "WP", apiValue: "mobile_money" },
  { id: "bank", label: "Pay by Bank", mask: "***0786", color: "#1a273c", initials: "PB", apiValue: "bank_transfer" }
];

const QR_SIZE = 21;

const finderValue = (row, col, top, left) => {
  const r = row - top;
  const c = col - left;
  if (r < 0 || r > 6 || c < 0 || c > 6) return null;
  const border = r === 0 || r === 6 || c === 0 || c === 6;
  const center = r >= 2 && r <= 4 && c >= 2 && c <= 4;
  return border || center;
};

const QR_MODULES = Array.from({ length: QR_SIZE }, (_, row) =>
  Array.from({ length: QR_SIZE }, (_, col) => {
    const finders = [
      finderValue(row, col, 0, 0),
      finderValue(row, col, 0, QR_SIZE - 7),
      finderValue(row, col, QR_SIZE - 7, 0)
    ].filter((value) => value !== null);

    if (finders.length > 0) return finders[0];
    return ((row * 7 + col * 13 + (row * col) % 5) % 3 === 0);
  })
);

const QrCode = () => (
  <div className="qr-code" role="img" aria-label="Merchant QR code">
    {QR_MODULES.map((row, rowIndex) => (
      <div className="qr-row" key={rowIndex}>
        {row.map((on, colIndex) => (
          <span key={colIndex} className={on ? "qr-on" : "qr-off"} />
        ))}
      </div>
    ))}
  </div>
);

const MerchantPayment = () => {
  const navigate = useNavigate();
  const [amount, setAmount] = useState("");
  const [merchant, setMerchant] = useState("Merchant");
  const [paymentMethod, setPaymentMethod] = useState(PAYMENT_METHODS[0].id);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [qrScanned, setQrScanned] = useState(false);

  const selectedMethod = PAYMENT_METHODS.find((method) => method.id === paymentMethod) || PAYMENT_METHODS[0];

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
      const res = await payMerchant({
        amount,
        merchant,
        payment_method: selectedMethod.apiValue
      });
      setMessage(res.message || "Merchant payment successful.");
      setAmount("");
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
        <TopNavbar title="Merchant Pay" />

        <div className="merchant-layout">
          <form className="merchant-form-card" onSubmit={handlePay}>
            <div className="form-tabs" role="tablist" aria-label="Payment type">
              <Link to="/merchant-payment" className="active-tab" role="tab" aria-selected="true">Merchant Pay</Link>
              <Link to="/bill-payment" role="tab" aria-selected="false">Bill Payment</Link>
            </div>

            <div className="merchant-fields">
              <div className="field">
                <label htmlFor="merchant">Merchant</label>
                <input
                  id="merchant"
                  type="text"
                  value={merchant}
                  onChange={(e) => setMerchant(e.target.value)}
                  placeholder="Merchant name"
                />
              </div>
              <div className="field">
                <label htmlFor="merchant-amount">Amount</label>
                <input
                  id="merchant-amount"
                  type="number"
                  min="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter amount"
                />
              </div>
            </div>

            <div className="method-heading">
              <span>Payment Method</span>
              <span className="method-hint">Choose an account</span>
            </div>

            <div className="method-list">
              {PAYMENT_METHODS.map((method) => (
                <button
                  key={method.id}
                  type="button"
                  className={`method-row${paymentMethod === method.id ? " selected" : ""}`}
                  onClick={() => setPaymentMethod(method.id)}
                  aria-pressed={paymentMethod === method.id}
                >
                  <span className="method-icon" style={{ backgroundColor: method.color }}>
                    {method.initials}
                  </span>
                  <span className="method-name">{method.label}</span>
                  <span className="method-mask">{method.mask}</span>
                  <span className="method-check" aria-hidden="true">
                    {paymentMethod === method.id ? "\u2713" : ""}
                  </span>
                </button>
              ))}
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

          <aside className="merchant-side" aria-label="Merchant QR and review">
            <div className="qr-card">
              <h3>Pay by Phone?<br />Scan QR Code</h3>
              <button
                type="button"
                className={`qr-button${qrScanned ? " scanned" : ""}`}
                onClick={() => setQrScanned(true)}
                title="Click to simulate scanning"
              >
                <QrCode />
              </button>
              {qrScanned && <p className="qr-status">QR code scanned!</p>}
            </div>

            <div className="side-card review-card">
              <h3>Review:</h3>
              <textarea placeholder="Leave a comment..." rows="4" />
              <p className="rate">Rate: {"\u2B50\u2B50\u2B50\u2B50\u2606"}</p>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
};

export default MerchantPayment;
