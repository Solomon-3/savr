import { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { fetchGoal, contribute, verifyCode } from "../api";
import PaymentModal from "../components/PaymentModal";
import ContributorList from "../components/ContributorList";
import ActivityFeed from "../components/ActivityFeed";

function InviteGate({ goalId, onUnlocked }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!code.trim()) return setError("Enter the invite code");

    setChecking(true);
    try {
      await verifyCode(goalId, code.trim());
      // Valid — cache it so the user doesn't have to re-enter on refresh
      localStorage.setItem(`savr_code_${goalId}`, code.trim().toUpperCase());
      onUnlocked(code.trim().toUpperCase());
    } catch {
      setError("Invalid invite code. Check with the goal creator.");
    } finally {
      setChecking(false);
    }
  }

  return (
    <div className="invite-gate">
      <div className="invite-gate-icon">&#128274;</div>
      <h2>Invite Only</h2>
      <p>This is a collaborative goal. Enter the invite code to contribute.</p>
      <form onSubmit={handleSubmit} className="invite-gate-form">
        {error && <div className="form-error">{error}</div>}
        <input
          type="text"
          placeholder="e.g., A3X9KP"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          maxLength={6}
          className="invite-code-input"
          autoFocus
        />
        <button type="submit" className="btn-primary btn-full" disabled={checking}>
          {checking ? "Checking..." : "Join Goal"}
        </button>
      </form>
    </div>
  );
}

export default function GoalDetail() {
  const { id } = useParams();
  const [goal, setGoal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Invite code access — null means not yet unlocked
  const [unlockedCode, setUnlockedCode] = useState(() =>
    localStorage.getItem(`savr_code_${id}`) || null
  );

  // Contribution form
  const [contributorName, setContributorName] = useState("");
  const [amount, setAmount] = useState("");
  const [contributing, setContributing] = useState(false);
  const [formError, setFormError] = useState("");

  // Payment modal
  const [paymentData, setPaymentData] = useState(null);

  const loadGoal = useCallback(() => {
    fetchGoal(id)
      .then(setGoal)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    loadGoal();
  }, [loadGoal]);

  async function handleContribute(e) {
    e.preventDefault();
    setFormError("");

    if (!contributorName.trim()) return setFormError("Enter your name");
    if (!amount || Number(amount) <= 0) return setFormError("Enter a valid amount");

    setContributing(true);
    try {
      const data = await contribute(id, contributorName.trim(), Number(amount), unlockedCode);
      setPaymentData(data);
    } catch (err) {
      // If the stored code was rejected server-side, clear it so the gate shows again
      if (err.message === "Invalid invite code") {
        localStorage.removeItem(`savr_code_${id}`);
        setUnlockedCode(null);
      }
      setFormError(err.message);
    } finally {
      setContributing(false);
    }
  }

  function handlePaymentSuccess() {
    setPaymentData(null);
    setAmount("");
    loadGoal();
  }

  if (loading) return <div className="loading">Loading goal...</div>;
  if (error) return <div className="error-state">Error: {error}</div>;
  if (!goal) return <div className="error-state">Goal not found</div>;

  const pct = Math.min(100, Math.round((goal.current_amount / goal.target_amount) * 100));
  const remaining = Math.max(0, goal.target_amount - goal.current_amount);
  const btcAmount = (goal.target_amount / 100_000_000).toFixed(8);
  const needsCode = goal.goal_type === "collaborative" && !unlockedCode;

  return (
    <div className="goal-detail">
      <Link to="/" className="back-link">&larr; All Goals</Link>

      <div className="goal-header">
        <div className="goal-header-left">
          <div className="goal-badges">
            <span className={`goal-badge ${goal.goal_type}`}>
              {goal.goal_type === "collaborative" ? "Collaborative" : "Personal"}
            </span>
            <span className="goal-badge freq">{goal.frequency} target</span>
            {unlockedCode && (
              <span className="goal-badge unlocked">&#128275; Joined</span>
            )}
          </div>
          <h1>{goal.name}</h1>
          {goal.description && <p className="goal-desc">{goal.description}</p>}
          <p className="goal-meta">
            Created by <strong>{goal.creator_name}</strong>
            {goal.deadline && <> &middot; Deadline: {new Date(goal.deadline).toLocaleDateString()}</>}
          </p>
        </div>
      </div>

      <div className="goal-progress-section">
        <div className="progress-stats">
          <div className="stat">
            <span className="stat-value">{Number(goal.current_amount).toLocaleString()}</span>
            <span className="stat-label">sats saved</span>
          </div>
          <div className="stat">
            <span className="stat-value">{Number(goal.target_amount).toLocaleString()}</span>
            <span className="stat-label">sats target ({btcAmount} BTC)</span>
          </div>
          <div className="stat">
            <span className="stat-value">{pct}%</span>
            <span className="stat-label">complete</span>
          </div>
          <div className="stat">
            <span className="stat-value">{Number(remaining).toLocaleString()}</span>
            <span className="stat-label">sats remaining</span>
          </div>
        </div>
        <div className="progress-bar large">
          <div className="progress-fill" style={{ width: `${pct}%` }} />
        </div>
      </div>

      {/* Progress and activity are always visible (transparency) */}
      <div className="goal-content">
        <div className="goal-main">
          {needsCode ? (
            <InviteGate goalId={id} onUnlocked={setUnlockedCode} />
          ) : (
            <div className="contribute-section">
              <h2>Contribute</h2>
              <form onSubmit={handleContribute} className="contribute-form">
                {formError && <div className="form-error">{formError}</div>}
                <div className="form-row">
                  <input
                    type="text"
                    placeholder="Your name"
                    value={contributorName}
                    onChange={(e) => setContributorName(e.target.value)}
                  />
                  <input
                    type="number"
                    min="1"
                    placeholder="Amount (sats)"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                  <button type="submit" className="btn-primary" disabled={contributing}>
                    {contributing ? "..." : "Pay"}
                  </button>
                </div>
              </form>
            </div>
          )}

          <ActivityFeed contributions={goal.contributions || []} />
        </div>

        <div className="goal-sidebar">
          <ContributorList contributions={goal.contributions || []} />
        </div>
      </div>

      {paymentData && (
        <PaymentModal
          data={paymentData}
          onSuccess={handlePaymentSuccess}
          onClose={() => setPaymentData(null)}
        />
      )}
    </div>
  );
}
