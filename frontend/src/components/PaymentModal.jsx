import { useState, useEffect, useCallback } from "react";
import { checkPayment } from "../api";

export default function PaymentModal({ data, onSuccess, onClose }) {
  const [status, setStatus] = useState("pending");
  const [copied, setCopied] = useState(false);

  const poll = useCallback(async () => {
    try {
      const result = await checkPayment(data.r_hash);
      if (result.settled) {
        setStatus("settled");
        setTimeout(() => onSuccess(), 1500);
      }
    } catch {
      // retry on next interval
    }
  }, [data.r_hash, onSuccess]);

  useEffect(() => {
    if (status === "settled") return;
    const interval = setInterval(poll, 2500);
    return () => clearInterval(interval);
  }, [poll, status]);

  function copyInvoice() {
    navigator.clipboard.writeText(data.payment_request);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        {status === "settled" ? (
          <div className="payment-success">
            <div className="success-icon">&#9889;</div>
            <h2>Payment Received!</h2>
            <p>Your contribution of {Number(data.contribution.amount).toLocaleString()} sats has been confirmed.</p>
          </div>
        ) : (
          <>
            <h2>Pay {Number(data.contribution.amount).toLocaleString()} sats</h2>
            <p className="modal-subtitle">Scan or copy the invoice below</p>
            <div className="qr-container">
              <img
                src={`data:image/png;base64,${data.qr_code}`}
                alt="Lightning Invoice QR"
                className="qr-code"
              />
            </div>
            <div className="invoice-box" onClick={copyInvoice}>
              <code>{data.payment_request}</code>
              <span className="copy-hint">{copied ? "Copied!" : "Click to copy"}</span>
            </div>
            <div className="payment-spinner">
              <div className="spinner" />
              <span>Waiting for payment...</span>
            </div>
            <button className="btn-secondary" onClick={onClose}>Cancel</button>
          </>
        )}
      </div>
    </div>
  );
}
