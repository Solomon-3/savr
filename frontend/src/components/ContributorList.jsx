export default function ContributorList({ contributions }) {
  const settled = contributions.filter((c) => c.status === "settled");
  if (settled.length === 0) return <p className="empty-text">No contributions yet. Be the first!</p>;

  // Aggregate by contributor
  const byName = {};
  for (const c of settled) {
    if (!byName[c.contributor_name]) {
      byName[c.contributor_name] = { total: 0, count: 0 };
    }
    byName[c.contributor_name].total += c.amount;
    byName[c.contributor_name].count += 1;
  }

  const sorted = Object.entries(byName).sort((a, b) => b[1].total - a[1].total);

  return (
    <div className="contributor-list">
      <h3>Contributors</h3>
      <table className="contrib-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Name</th>
            <th>Total</th>
            <th>Contributions</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map(([name, data], i) => (
            <tr key={name}>
              <td>{i + 1}</td>
              <td>{name}</td>
              <td>{Number(data.total).toLocaleString()} sats</td>
              <td>{data.count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
