import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchGoals } from "../api";
import GoalCard from "../components/GoalCard";

export default function Dashboard() {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetchGoals()
      .then(setGoals)
      .catch(() => setGoals([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered =
    filter === "all"
      ? goals
      : goals.filter((g) => g.goal_type === filter);

  if (loading) {
    return <div className="loading">Loading goals...</div>;
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h1>Savings Goals</h1>
          <p className="subtitle">
            Save in Bitcoin with complete transparency
          </p>
        </div>
        <Link to="/create" className="btn-primary">
          + Create Goal
        </Link>
      </div>

      <div className="filter-bar">
        <button
          className={`filter-btn ${filter === "all" ? "active" : ""}`}
          onClick={() => setFilter("all")}
        >
          All
        </button>
        <button
          className={`filter-btn ${filter === "personal" ? "active" : ""}`}
          onClick={() => setFilter("personal")}
        >
          Personal
        </button>
        <button
          className={`filter-btn ${filter === "collaborative" ? "active" : ""}`}
          onClick={() => setFilter("collaborative")}
        >
          Collaborative
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">&#9889;</div>
          <h2>No goals yet</h2>
          <p>Create your first savings goal and start stacking sats!</p>
          <Link to="/create" className="btn-primary">
            Create a Goal
          </Link>
        </div>
      ) : (
        <div className="goals-grid">
          {filtered.map((goal) => (
            <GoalCard key={goal.id} goal={goal} />
          ))}
        </div>
      )}
    </div>
  );
}
