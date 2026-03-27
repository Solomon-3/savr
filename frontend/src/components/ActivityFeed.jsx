export default function ActivityFeed({ contributions }) {
  const settled = contributions.filter((c) => c.status === "settled");
  if (settled.length === 0) return null;

  return (
    <div className="activity-feed">
      <h3>Recent Activity</h3>
      <ul className="activity-list">
        {settled.slice(0, 20).map((c) => (
          <li key={c.id} className="activity-item">
            <span className="activity-icon">&#9889;</span>
            <span className="activity-text">
              <strong>{c.contributor_name}</strong> contributed{" "}
              <strong>{Number(c.amount).toLocaleString()} sats</strong>
            </span>
            <span className="activity-time">
              {new Date(c.settled_at || c.created_at).toLocaleDateString()}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
