import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Sidebar, { TopNavbar } from "../Layout/Sidebar";
import receiptAPI from "../../services/receiptAPI";
import "./Receipts.css";

const STATUS_TONES = {
  completed: "success",
  pending: "warning",
  failed: "danger",
  reversed: "neutral",
  refunded: "neutral"
};

const STATUS_LABELS = {
  completed: "Completed",
  pending: "Pending",
  failed: "Failed",
  reversed: "Reversed",
  refunded: "Refunded"
};

const formatMoney = (receipt) =>
  `${receipt.currency || "XAF"} ${Number(receipt.amount || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;

const formatDate = (value, withTime = false) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {})
  });
};

const successor = (receipt) =>
  receipt.recipient?.name ||
  receipt.merchant?.name ||
  receipt.serviceName ||
  "Solvent account";

const receiptText = (receipt) =>
  [
    "SOLVENT RECEIPT",
    `Reference: ${receipt.reference}`,
    `Status: ${STATUS_LABELS[receipt.status] || receipt.statusLabel || receipt.status}`,
    `Type: ${receipt.title}`,
    `Amount: ${formatMoney(receipt)}`,
    `Date: ${formatDate(receipt.date, true)}`,
    `Paid by: ${receipt.payer?.name || "-"} (${receipt.payer?.email || "-"})`,
    `Paid to: ${successor(receipt)}`,
    `Method: ${receipt.methodLabel || receipt.method || "-"}`,
    receipt.accountNumber ? `Account: ${receipt.accountNumber}` : null,
    receipt.narration ? `Note: ${receipt.narration}` : null,
    "",
    "This is a computer-generated receipt from Solvent."
  ]
    .filter(Boolean)
    .join("\n");

const ReceiptView = () => {
  const { reference } = useParams();
  const [receipt, setReceipt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");

    receiptAPI
      .getReceipt(reference)
      .then((response) => {
        if (active) setReceipt(response.data);
      })
      .catch((loadError) => {
        if (active) setError(loadError.message || "Receipt not found");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [reference]);

  const copyReference = async () => {
    if (!receipt) return;
    try {
      await navigator.clipboard.writeText(receipt.reference);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  const downloadReceipt = () => {
    if (!receipt) return;
    const blob = new Blob([receiptText(receipt)], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${receipt.reference}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="app-shell">
      <Sidebar />

      <main className="main-content">
        <TopNavbar title="Receipt" />

        <div className="receipt-view-page">
          <div className="receipt-view-toolbar">
            <Link to="/receipts" className="receipt-back-link">‹ Back to receipts</Link>
            <div className="receipt-view-actions">
              <button type="button" className="receipt-action ghost" onClick={copyReference} disabled={!receipt}>
                {copied ? "Copied" : "Copy reference"}
              </button>
              <button type="button" className="receipt-action ghost" onClick={downloadReceipt} disabled={!receipt}>
                Download
              </button>
              <button type="button" className="receipt-action primary" onClick={() => window.print()} disabled={!receipt}>
                Print / Save PDF
              </button>
            </div>
          </div>

          {error && (
            <div className="receipts-alert" role="alert">
              {error}. <Link to="/receipts">Return to receipts</Link>
            </div>
          )}

          {loading ? (
            <div className="receipts-loading">
              <span className="receipts-spinner" aria-hidden="true" />
              <p>Loading receipt...</p>
            </div>
          ) : receipt ? (
            <article className="receipt-sheet" aria-label={`Receipt ${receipt.reference}`}>
              <header className="receipt-sheet-header">
                <div className="receipt-brand">
                  <img src="/logo.png" alt="Solvent" />
                  <div>
                    <strong>SOLVENT</strong>
                    <span>Payments &amp; transfers</span>
                  </div>
                </div>
                <div className="receipt-sheet-heading">
                  <span>Official receipt</span>
                  <strong>{receipt.reference}</strong>
                  <small>{formatDate(receipt.date, true)}</small>
                </div>
              </header>

              <div className="receipt-sheet-summary">
                <div>
                  <span className="receipt-sheet-label">Amount paid</span>
                  <h2>{formatMoney(receipt)}</h2>
                  <p>{receipt.title}</p>
                </div>
                <span className={`receipt-status large ${STATUS_TONES[receipt.status] || "neutral"}`}>
                  {STATUS_LABELS[receipt.status] || receipt.statusLabel || receipt.status}
                </span>
              </div>

              <div className="receipt-sheet-grid">
                <div className="receipt-detail">
                  <span>Paid by</span>
                  <strong>{receipt.payer?.name || "Solvent user"}</strong>
                  <small>{receipt.payer?.email || receipt.payer?.phone || "-"}</small>
                </div>
                <div className="receipt-detail">
                  <span>Paid to</span>
                  <strong>{successor(receipt)}</strong>
                  <small>
                    {receipt.merchant?.code || receipt.accountNumber || receipt.methodLabel || "-"}
                  </small>
                </div>
                <div className="receipt-detail">
                  <span>Payment method</span>
                  <strong>{receipt.methodLabel || receipt.method || "-"}</strong>
                  <small>Solvent secure payment</small>
                </div>
                <div className="receipt-detail">
                  <span>Reference</span>
                  <strong className="receipt-mono">{receipt.reference}</strong>
                  <small>Keep this reference for support</small>
                </div>
              </div>

              {(receipt.merchant || receipt.serviceName || receipt.narration) && (
                <div className="receipt-sheet-note">
                  <span>Details</span>
                  {receipt.merchant && (
                    <p>
                      <strong>{receipt.merchant.name}</strong>
                      {receipt.merchant.category ? ` · ${receipt.merchant.category}` : ""}
                      {receipt.merchant.city ? ` · ${receipt.merchant.city}` : ""}
                    </p>
                  )}
                  {receipt.serviceName && <p>Service: {receipt.serviceName}</p>}
                  {receipt.narration && <p>Note: {receipt.narration}</p>}
                </div>
              )}

              <footer className="receipt-sheet-footer">
                <p>This is a computer-generated receipt and does not require a signature.</p>
                <p>Solvent · support@solvent.app</p>
              </footer>
            </article>
          ) : null}
        </div>
      </main>
    </div>
  );
};

export default ReceiptView;
