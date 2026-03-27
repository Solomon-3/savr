import { Link } from "react-router-dom";

export default function GoalCard({ goal }) {
  const pct = Math.min(100, Math.round((goal.current_amount / goal.target_amount) * 100));
  const remaining = Math.max(0, goal.target_amount - goal.current_amount);

  return (
    <Link to={`/goal/${goal.id}`} className="goal-card">
      <div className="goal-card-header">
        <span className={`goal-badge ${goal.goal_type}`}>
          {goal.goal_type === "collaborative" ? "Collaborative" : "Personal"}
        </span>
        <span className="goal-freq">{goal.frequency}</span>
      </div>
      <h3 className="goal-card-title">{goal.name}</h3>
      {goal.description && <p className="goal-card-desc">{goal.description}</p>}
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${pct}%` }} />
      </div>
      <div className="goal-card-stats">
        <span className="goal-amount">{Number(goal.current_amount).toLocaleString()} sats</span>
        <span className="goal-target">of {Number(goal.target_amount).toLocaleString()} sats</span>
      </div>
      <div className="goal-card-footer">
        <span className="goal-pct">{pct}%</span>
        <span className="goal-remaining">{Number(remaining).toLocaleString()} sats to go</span>
      </div>
      <div className="goal-creator">by {goal.creator_name}</div>
    </Link>
  );
}
