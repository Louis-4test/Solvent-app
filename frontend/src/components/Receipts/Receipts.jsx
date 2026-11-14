/* eslint-disable react/prop-types */
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Sidebar, { TopNavbar } from "../Layout/Sidebar";
import receiptAPI from "../../services/receiptAPI";
import "./Receipts.css";

const PAGE_SIZE = 8;

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
    maximumFractionDigits: 2
  })}`;

const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
};

const ReceiptIcon = ({ kind }) => (
  <span className={`receipt-kind-icon ${kind}`} aria-hidden="true">
    {kind === "transfer" ? "↗" : "▤"}
  </span>
);

const Receipts = () => {
  const [receipts, setReceipts] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [kind, setKind] = useState("");
  const [status, setStatus] = useState("");
  const [searchDraft, setSearchDraft] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");

    receiptAPI
      .listReceipts({ page, limit: PAGE_SIZE, search, kind, status })
      .then((response) => {
        if (!active) return;
        setReceipts(response.data || []);
        setPagination(response.pagination || null);
      })
      .catch((loadError) => {
        if (active) setError(loadError.message || "Failed to load receipts");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [page, search, kind, status]);

  const changeFilter = (setter, value) => {
    setter(value);
    setPage(1);
  };

  const submitSearch = (event) => {
    event.preventDefault();
    setSearch(searchDraft.trim());
    setPage(1);
  };

  return (
    <div className="app-shell">
      <Sidebar />

      <main className="main-content">
        <TopNavbar title="Receipts" />

        <div className="receipts-page">
          <section className="receipts-hero">
            <div>
              <span className="receipts-eyebrow">Proof of payment</span>
              <h2>Your receipts</h2>
              <p>View, print, or save a record of every transfer and payment you make.</p>
            </div>
            <div className="receipts-hero-stat">
              <strong>{pagination ? pagination.total : "-"}</strong>
              <span>receipt{pagination?.total === 1 ? "" : "s"} on record</span>
            </div>
          </section>

          <section className="receipts-panel">
            <div className="receipts-panel-heading">
              <div>
                <h3>Receipt history</h3>
                <p>Search by reference, merchant, or note.</p>
              </div>

              <form className="receipts-toolbar" onSubmit={submitSearch}>
                <input
                  type="search"
                  value={searchDraft}
                  onChange={(event) => setSearchDraft(event.target.value)}
                  placeholder="Search receipts"
                  aria-label="Search receipts"
                />
                <select
                  value={kind}
                  onChange={(event) => changeFilter(setKind, event.target.value)}
                  aria-label="Filter receipts by type"
                >
                  <option value="">All types</option>
                  <option value="payment">Payments</option>
                  <option value="transfer">Transfers</option>
                </select>
                <select
                  value={status}
                  onChange={(event) => changeFilter(setStatus, event.target.value)}
                  aria-label="Filter receipts by status"
                >
                  <option value="">All statuses</option>
                  <option value="completed">Completed</option>
                  <option value="pending">Pending</option>
                  <option value="failed">Failed</option>
                  <option value="reversed">Reversed</option>
                </select>
                <button type="submit">Search</button>
              </form>
            </div>

            {error && <div className="receipts-alert" role="alert">{error}</div>}

            {loading ? (
              <div className="receipts-loading">
                <span className="receipts-spinner" aria-hidden="true" />
                <p>Loading receipts...</p>
              </div>
            ) : receipts.length === 0 ? (
              <div className="receipts-empty">
                <span aria-hidden="true">▤</span>
                <strong>No receipts found</strong>
                <p>Your completed transfers and payments will appear here.</p>
              </div>
            ) : (
              <>
                <div className="receipts-list">
                  {receipts.map((receipt) => (
                    <Link
                      key={`${receipt.kind}-${receipt.reference}`}
                      to={`/receipts/${encodeURIComponent(receipt.reference)}`}
                      className="receipt-row"
                    >
                      <ReceiptIcon kind={receipt.kind} />
                      <span className="receipt-row-main">
                        <strong>{receipt.title}</strong>
                        <small>
                          {receipt.recipient?.name || receipt.narration || receipt.methodLabel}
                        </small>
                      </span>
                      <span className="receipt-row-ref">
                        <small>Reference</small>
                        <strong>{receipt.reference}</strong>
                      </span>
                      <span className="receipt-row-date">
                        <small>Date</small>
                        <strong>{formatDate(receipt.date)}</strong>
                      </span>
                      <span className="receipt-row-amount">{formatMoney(receipt)}</span>
                      <span
                        className={`receipt-status ${STATUS_TONES[receipt.status] || "neutral"}`}
                      >
                        {STATUS_LABELS[receipt.status] || receipt.statusLabel || receipt.status}
                      </span>
                      <span className="receipt-row-arrow" aria-hidden="true">›</span>
                    </Link>
                  ))}
                </div>

                {pagination && pagination.totalPages > 1 && (
                  <div className="receipts-pagination">
                    <span>
                      Page {pagination.page} of {pagination.totalPages}
                    </span>
                    <div>
                      <button
                        type="button"
                        onClick={() => setPage((current) => Math.max(1, current - 1))}
                        disabled={pagination.page <= 1}
                      >
                        Previous
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setPage((current) => Math.min(pagination.totalPages, current + 1))
                        }
                        disabled={pagination.page >= pagination.totalPages}
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      </main>
    </div>
  );
};

export default Receipts;
