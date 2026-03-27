import { useState } from "react";
import { decodeInvoice, sendPayment } from "../api";

const STAGES = { INPUT: "input", PREVIEW: "preview", SENDING: "sending", DONE: "done", ERROR: "error" };

export default function SendModal({ goalId, inviteCode, goalType, onClose }) {
  const [stage, setStage] = useState(STAGES.INPUT);
  const [payReq, setPayReq] = useState("");
  const [decoded, setDecoded] = useState(null);
  const [preimage, setPreimage] = useState("");
  const [error, setError] = useState("");
  const [decoding, setDecoding] = useState(false);

  async function handleDecode(e) {
    e.preventDefault();
    setError("");
    const trimmed = payReq.trim().toLowerCase();
    if (!trimmed || !trimmed.startsWith("ln")) {
      return setError("Paste a valid BOLT11 Lightning invoice (starts with 'ln...')");
    }
    setDecoding(true);
    try {
      const data = await decodeInvoice(goalId, trimmed);
      setDecoded(data);
      setStage(STAGES.PREVIEW);
    } catch (err) {
      setError(err.message);
    } finally {
      setDecoding(false);
    }
  }

  async function handleSend() {
    setStage(STAGES.SENDING);
    setError("");
    try {
      const result = await sendPayment(goalId, payReq.trim().toLowerCase(), inviteCode);
      setPreimage(result.payment_preimage || "");
      setStage(STAGES.DONE);
    } catch (err) {
      setError(err.message);
      setStage(STAGES.ERROR);
    }
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal send-modal">

        {/* INPUT stage */}
        {stage === STAGES.INPUT && (
          <>
            <div className="modal-header">
              <h2>&#9889; Send Sats</h2>
              <button className="modal-close" onClick={onClose}>&#10005;</button>
            </div>
            <p className="modal-subtitle">
              Paste the Lightning invoice you want to pay from this goal's funds.
            </p>
            <form onSubmit={handleDecode} className="send-form">
              {error && <div className="form-error">{error}</div>}
              <textarea
                className="invoice-textarea"
                placeholder="lnbc..."
                value={payReq}
                onChange={(e) => setPayReq(e.target.value)}
                rows={4}
                autoFocus
              />
              <button type="submit" className="btn-primary btn-full" disabled={decoding}>
                {decoding ? "Decoding..." : "Preview Payment"}
              </button>
            </form>
          </>
        )}

        {/* PREVIEW stage */}
        {stage === STAGES.PREVIEW && decoded && (
          <>
            <div className="modal-header">
              <h2>Confirm Payment</h2>
              <button className="modal-close" onClick={onClose}>&#10005;</button>
            </div>
            <p className="modal-subtitle">Review the details before sending.</p>

            <div className="send-preview">
              <div className="send-preview-row">
                <span className="send-preview-label">Amount</span>
                <span className="send-preview-value accent">
                  {Number(decoded.amount).toLocaleString()} sats
                </span>
              </div>
              {decoded.memo && (
                <div className="send-preview-row">
                  <span className="send-preview-label">Memo</span>
                  <span className="send-preview-value">{decoded.memo}</span>
                </div>
              )}
              <div className="send-preview-row">
                <span className="send-preview-label">Destination</span>
                <span className="send-preview-value mono truncate">
                  {decoded.destination}
                </span>
              </div>
            </div>

            <div className="send-actions">
              <button className="btn-secondary" onClick={() => setStage(STAGES.INPUT)}>
                &larr; Back
              </button>
              <button className="btn-primary" onClick={handleSend}>
                &#9889; Confirm Send
              </button>
            </div>
          </>
        )}

        {/* SENDING stage */}
        {stage === STAGES.SENDING && (
          <div className="send-progress">
            <div className="spinner large-spinner" />
            <h2>Sending...</h2>
            <p className="modal-subtitle">Broadcasting payment over Lightning Network</p>
          </div>
        )}

        {/* DONE stage */}
        {stage === STAGES.DONE && (
          <div className="send-success">
            <div className="success-icon">⚡</div>
            <h2>Payment Sent!</h2>
            <p className="modal-subtitle">
              {decoded && (
                <>
                  <strong>{Number(decoded.amount).toLocaleString()} sats</strong> sent
                  successfully.
                </>
              )}
            </p>
            {preimage && (
              <div className="preimage-box">
                <span className="preimage-label">Payment Proof (Preimage)</span>
                <code className="preimage-value">{preimage}</code>
              </div>
            )}
            <button className="btn-primary btn-full" onClick={onClose}>
              Done
            </button>
          </div>
        )}

        {/* ERROR stage */}
        {stage === STAGES.ERROR && (
          <>
            <div className="modal-header">
              <h2>Payment Failed</h2>
              <button className="modal-close" onClick={onClose}>&#10005;</button>
            </div>
            <div className="form-error" style={{ margin: "16px 0" }}>{error}</div>
            <button
              className="btn-secondary btn-full"
              onClick={() => { setStage(STAGES.INPUT); setError(""); }}
            >
              Try Again
            </button>
          </>
        )}

      </div>
    </div>
  );
}
