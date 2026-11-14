/* eslint-disable react/prop-types */
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import QRCode from "qrcode";
import { Html5Qrcode } from "html5-qrcode";
import Sidebar, { TopNavbar } from "../Layout/Sidebar";
import { payWithQR } from "../../services/paymentAPI";
import merchantAPI from "../../services/merchantAPI";
import "./BillPayment.css";
import "./MerchantPayment.css";

const PAYMENT_METHODS = [
  { id: "orange", label: "Orange Money", mask: "***4342", color: "#ff7900", initials: "OM", apiValue: "mobile_money" },
  { id: "mobile", label: "Mobile Money", mask: "***2414", color: "#f4c20d", initials: "MM", apiValue: "mobile_money" },
  { id: "wallet", label: "Wallets Pay", mask: "***0473", color: "#1a73e8", initials: "WP", apiValue: "mobile_money" },
  { id: "bank", label: "Pay by Bank", mask: "***0786", color: "#1a273c", initials: "PB", apiValue: "bank_transfer" }
];

const formatMoney = (value) =>
  `XAF ${Number(value || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const extractMerchantCode = (payload) => {
  const raw = String(payload || "").trim();
  if (!raw) return "";

  if (raw.startsWith("{")) {
    try {
      const value = JSON.parse(raw);
      return String(value.code || value.merchantCode || value.merchant || "").trim().toUpperCase();
    } catch {
      return "";
    }
  }

  const prefix = "solvent://merchant/";
  if (raw.toLowerCase().startsWith(prefix)) {
    const rest = raw.slice(prefix.length).split(/[?#]/)[0];
    try {
      return decodeURIComponent(rest).trim().toUpperCase();
    } catch {
      return rest.trim().toUpperCase();
    }
  }

  if (raw.toLowerCase().startsWith("solvent:merchant:")) {
    return raw.slice("solvent:merchant:".length).split(/[?#]/)[0].trim().toUpperCase();
  }

  if (/^https?:\/\//i.test(raw)) {
    try {
      const url = new URL(raw);
      const code =
        url.searchParams.get("merchant") ||
        url.searchParams.get("merchantCode") ||
        url.searchParams.get("code") ||
        url.pathname.split("/").filter(Boolean).pop();
      return String(code || "").trim().toUpperCase();
    } catch {
      return "";
    }
  }

  return raw.toUpperCase();
};

const QrScannerModal = ({ open, onClose, onDecoded }) => {
  const scannerRef = useRef(null);
  const activeRef = useRef(false);
  const handledRef = useRef(false);
  const decodedRef = useRef(onDecoded);
  const [error, setError] = useState("");
  const [starting, setStarting] = useState(true);
  const [manualCode, setManualCode] = useState("");

  useEffect(() => {
    decodedRef.current = onDecoded;
  }, [onDecoded]);

  useEffect(() => {
    if (!open) return undefined;

    let cancelled = false;
    handledRef.current = false;
    setError("");
    setStarting(true);
    setManualCode("");

    const startScanner = async () => {
      try {
        const scanner = new Html5Qrcode("solvent-qr-reader", { verbose: false });
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 230, height: 230 } },
          (decodedText) => {
            if (cancelled || handledRef.current) return;
            handledRef.current = true;
            activeRef.current = true;
            decodedRef.current?.(decodedText);
          },
          () => {}
        );

        if (!cancelled) setStarting(false);
      } catch (startError) {
        if (!cancelled) {
          setStarting(false);
          setError(
            startError?.message?.includes("NotAllowed")
              ? "Camera access was denied. Allow camera access or enter the merchant code below."
              : "Camera scanning is unavailable on this device. Enter the merchant code below."
          );
        }
      }
    };

    const timer = window.setTimeout(startScanner, 80);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      const scanner = scannerRef.current;
      scannerRef.current = null;
      activeRef.current = false;

      if (scanner) {
        Promise.resolve()
          .then(() => scanner.stop())
          .then(() => scanner.clear())
          .catch(() => {});
      }
    };
  }, [open]);

  if (!open) return null;

  const submitManual = (event) => {
    event.preventDefault();
    const code = extractMerchantCode(manualCode);
    if (code) onDecoded(code);
  };

  return (
    <div className="qr-scanner-overlay" role="dialog" aria-modal="true" aria-label="Scan merchant QR code">
      <div className="qr-scanner-dialog">
        <div className="qr-scanner-heading">
          <div>
            <span>Scan to pay</span>
            <h3>Point at a Solvent merchant QR</h3>
          </div>
          <button type="button" className="qr-scanner-close" onClick={onClose} aria-label="Close scanner">
            ✕
          </button>
        </div>

        <div id="solvent-qr-reader" className="qr-reader" aria-label="Camera preview" />

        {starting && !error && <p className="qr-scanner-note">Starting camera...</p>}
        {error && <p className="qr-scanner-error" role="alert">{error}</p>}

        <form className="qr-manual-form" onSubmit={submitManual}>
          <label htmlFor="manual-merchant-code">Or enter the merchant code</label>
          <div>
            <input
              id="manual-merchant-code"
              type="text"
              value={manualCode}
              onChange={(event) => setManualCode(event.target.value)}
              placeholder="e.g. MRC-SOLVENT-MARKET"
              autoComplete="off"
            />
            <button type="submit" disabled={!manualCode.trim()}>Use code</button>
          </div>
        </form>

        <p className="qr-scanner-help">
          The code is printed under the QR at the merchant&apos;s checkout.
        </p>
      </div>
    </div>
  );
};

const MerchantPayment = () => {
  const navigate = useNavigate();
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [merchants, setMerchants] = useState([]);
  const [merchantsError, setMerchantsError] = useState("");
  const [selectedMerchant, setSelectedMerchant] = useState(null);
  const [manualCode, setManualCode] = useState("");
  const [lookupLoading, setLookupLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState(PAYMENT_METHODS[0].id);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [receipt, setReceipt] = useState(null);
  const [scanSource, setScanSource] = useState("");

  const selectedMethod = PAYMENT_METHODS.find((method) => method.id === paymentMethod) || PAYMENT_METHODS[0];

  useEffect(() => {
    let active = true;

    merchantAPI
      .listMerchants()
      .then((response) => {
        if (active) setMerchants(response.data || []);
      })
      .catch((loadError) => {
        if (active) setMerchantsError(loadError.message || "Could not load the merchant directory");
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    if (!selectedMerchant?.qrPayload) {
      setQrDataUrl("");
      return undefined;
    }

    QRCode.toDataURL(selectedMerchant.qrPayload, {
      width: 250,
      margin: 1,
      color: { dark: "#1a273c", light: "#ffffff" }
    })
      .then((url) => {
        if (active) setQrDataUrl(url);
      })
      .catch(() => {
        if (active) setQrDataUrl("");
      });

    return () => {
      active = false;
    };
  }, [selectedMerchant]);

  const chooseMerchant = (merchant, source = "directory") => {
    setSelectedMerchant(merchant);
    setManualCode(merchant.code);
    setScanSource(source);
    setError("");
    setMessage("");
    setReceipt(null);
  };

  const lookupMerchant = async (event) => {
    event?.preventDefault();
    const code = extractMerchantCode(manualCode);

    if (!code) {
      setError("Enter a merchant code or scan a QR code.");
      return;
    }

    const local = merchants.find(
      (merchant) => merchant.code.toUpperCase() === code || merchant.name.toUpperCase() === code
    );

    if (local) {
      chooseMerchant(local, "manual");
      return;
    }

    try {
      setLookupLoading(true);
      setError("");
      const response = await merchantAPI.getMerchant(code);
      chooseMerchant(response.data, "manual");
      setMerchants((current) => {
        if (current.some((merchant) => merchant.code === response.data.code)) return current;
        return [...current, response.data];
      });
    } catch (lookupError) {
      setError(lookupError.message || "Merchant not found. Check the code and try again.");
    } finally {
      setLookupLoading(false);
    }
  };

  const handleDecoded = async (payload) => {
    const code = extractMerchantCode(payload);
    setScannerOpen(false);
    setManualCode(code);

    if (!code) {
      setError("That QR code is not a Solvent merchant payment code.");
      return;
    }

    const local = merchants.find((merchant) => merchant.code.toUpperCase() === code);

    if (local) {
      chooseMerchant(local, "scan");
      setMessage(`QR scanned: ${local.name}`);
      return;
    }

    try {
      setLookupLoading(true);
      setError("");
      const response = await merchantAPI.getMerchant(code);
      chooseMerchant(response.data, "scan");
      setMessage(`QR scanned: ${response.data.name}`);
    } catch (lookupError) {
      setError(lookupError.message || "This merchant QR is invalid or inactive.");
    } finally {
      setLookupLoading(false);
    }
  };

  const handlePay = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!selectedMerchant) {
      setError("Scan a merchant QR or choose a merchant before paying.");
      return;
    }

    if (!amount || Number(amount) <= 0) {
      setError("Please enter a valid amount.");
      return;
    }

    try {
      setLoading(true);
      const response = await payWithQR({
        amount,
        merchantCode: selectedMerchant.code,
        qrPayload: selectedMerchant.qrPayload,
        payment_method: selectedMethod.apiValue,
        note
      });

      const nextReceipt = response.data?.receipt;
      setReceipt(nextReceipt || null);
      setMessage(response.message || `Payment to ${selectedMerchant.name} was successful.`);
      setAmount("");
      setNote("");
    } catch (payError) {
      setError(payError.message || "Payment failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const resetPayment = () => {
    setReceipt(null);
    setMessage("");
    setError("");
    setSelectedMerchant(null);
    setManualCode("");
    setAmount("");
    setNote("");
    setScanSource("");
    setQrDataUrl("");
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

            <div className="merchant-scan-banner">
              <div>
                <strong>Pay a merchant by QR</strong>
                <span>Scan the QR at checkout or enter the merchant code.</span>
              </div>
              <button type="button" className="merchant-scan-button" onClick={() => setScannerOpen(true)}>
                <span aria-hidden="true">⌗</span> Scan QR
              </button>
            </div>

            <div className="merchant-fields">
              <div className="field merchant-field-wide">
                <label htmlFor="merchant-select">Merchant</label>
                <select
                  id="merchant-select"
                  value={selectedMerchant?.code || ""}
                  onChange={(event) => {
                    const merchant = merchants.find((item) => item.code === event.target.value);
                    if (merchant) chooseMerchant(merchant);
                    else setSelectedMerchant(null);
                  }}
                >
                  <option value="">Select a merchant</option>
                  {merchants.map((merchant) => (
                    <option key={merchant.code} value={merchant.code}>
                      {merchant.name} — {merchant.code}
                    </option>
                  ))}
                </select>
                {merchantsError && <small className="merchant-hint error">{merchantsError}</small>}
              </div>

              <div className="field">
                <label htmlFor="merchant-amount">Amount</label>
                <input
                  id="merchant-amount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  placeholder="Enter amount"
                />
              </div>

              <div className="field">
                <label htmlFor="merchant-note">Note <span className="optional-label">(optional)</span></label>
                <input
                  id="merchant-note"
                  type="text"
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  placeholder="What is this payment for?"
                  maxLength={120}
                />
              </div>
            </div>

            <div className="merchant-code-lookup">
              <input
                type="text"
                value={manualCode}
                onChange={(event) => setManualCode(event.target.value)}
                placeholder="Merchant code, e.g. MRC-BLUE-CAFE"
                aria-label="Merchant code"
              />
              <button type="button" onClick={lookupMerchant} disabled={lookupLoading}>
                {lookupLoading ? "Looking up..." : "Find merchant"}
              </button>
            </div>

            {merchants.length > 0 && (
              <div className="merchant-demo-list" aria-label="Demo merchants">
                <span>Try a demo merchant:</span>
                <div>
                  {merchants.slice(0, 3).map((merchant) => (
                    <button
                      key={merchant.code}
                      type="button"
                      className={selectedMerchant?.code === merchant.code ? "selected" : ""}
                      onClick={() => chooseMerchant(merchant, "demo")}
                    >
                      {merchant.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

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

            {receipt && (
              <div className="merchant-receipt-success">
                <div>
                  <span>Payment successful</span>
                  <strong>{formatMoney(receipt.amount)}</strong>
                  <small>Reference {receipt.reference}</small>
                </div>
                <div className="merchant-receipt-actions">
                  <Link to={`/receipts/${encodeURIComponent(receipt.reference)}`}>View receipt</Link>
                  <button type="button" onClick={resetPayment}>New payment</button>
                </div>
              </div>
            )}

            <div className="form-actions">
              <button type="button" className="back-btn" onClick={() => navigate("/")}>{"< Back"}</button>
              <button type="submit" className="pay-btn" disabled={loading || !selectedMerchant}>
                {loading ? "Processing..." : "PAY"}
              </button>
            </div>
          </form>

          <aside className="merchant-side" aria-label="Merchant QR and review">
            <div className="qr-card">
              <h3>{selectedMerchant ? "Merchant QR ready" : "Pay by Phone?"}<br />{selectedMerchant ? selectedMerchant.name : "Scan QR Code"}</h3>

              {selectedMerchant ? (
                <>
                  <div className={`qr-image-frame${scanSource === "scan" ? " scanned" : ""}`}>
                    {qrDataUrl ? (
                      <img src={qrDataUrl} alt={`QR code for ${selectedMerchant.name}`} />
                    ) : (
                      <div className="qr-image-placeholder">Preparing QR...</div>
                    )}
                  </div>
                  <div className="qr-merchant-meta">
                    <strong>{selectedMerchant.name}</strong>
                    <span>{selectedMerchant.category}{selectedMerchant.city ? ` · ${selectedMerchant.city}` : ""}</span>
                    <code>{selectedMerchant.code}</code>
                  </div>
                  {scanSource === "scan" && <p className="qr-status">QR code scanned!</p>}
                  {scanSource !== "scan" && (
                    <button type="button" className="qr-change-button" onClick={() => setScannerOpen(true)}>
                      Scan a different QR
                    </button>
                  )}
                </>
              ) : (
                <>
                  <button
                    type="button"
                    className="qr-empty-button"
                    onClick={() => setScannerOpen(true)}
                    title="Open camera scanner"
                  >
                    <span className="qr-empty-icon" aria-hidden="true">⌗</span>
                    <span>Tap to scan merchant QR</span>
                  </button>
                  <p className="qr-empty-note">Or select a merchant from the directory on the left.</p>
                </>
              )}
            </div>

            <div className="merchant-summary-card">
              <h3>Payment summary</h3>
              <div>
                <span>Merchant</span>
                <strong>{selectedMerchant?.name || "Not selected"}</strong>
              </div>
              <div>
                <span>Amount</span>
                <strong>{amount ? formatMoney(amount) : "XAF 0.00"}</strong>
              </div>
              <div>
                <span>Method</span>
                <strong>{selectedMethod.label}</strong>
              </div>
              <small>A receipt is generated automatically after payment.</small>
            </div>

            <div className="side-card review-card">
              <h3>Review:</h3>
              <textarea
                placeholder="Leave a comment..."
                rows="4"
                value={note}
                onChange={(event) => setNote(event.target.value)}
                maxLength={280}
              />
              <p className="rate">Rate: {"\u2B50\u2B50\u2B50\u2B50\u2606"}</p>
            </div>
          </aside>
        </div>
      </main>

      <QrScannerModal
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onDecoded={handleDecoded}
      />
    </div>
  );
};

export default MerchantPayment;
