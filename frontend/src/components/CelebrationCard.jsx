export default function CelebrationCard({ goal, onSend }) {
  const btc = (goal.current_amount / 100_000_000).toFixed(8);

  return (
    <div className="celebration-card">
      <div className="celebration-fireworks">
        <span>🎉</span>
        <span>⚡</span>
        <span>🎊</span>
      </div>

      <h2 className="celebration-title">Goal Reached!</h2>
      <p className="celebration-subtitle">
        <strong>{goal.name}</strong> hit its target of{" "}
        <strong>{Number(goal.target_amount).toLocaleString()} sats</strong> ({btc} BTC).
        Time to spend it!
      </p>

      <div className="celebration-stats">
        <div className="cel-stat">
          <span className="cel-stat-value">
            {Number(goal.current_amount).toLocaleString()}
          </span>
          <span className="cel-stat-label">sats collected</span>
        </div>
        <div className="cel-stat-divider">⚡</div>
        <div className="cel-stat">
          <span className="cel-stat-value">{btc}</span>
          <span className="cel-stat-label">BTC</span>
        </div>
      </div>

      <button className="btn-primary btn-full btn-send" onClick={onSend}>
        &#9889; Send Sats
      </button>
    </div>
  );
}
