import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createGoal } from "../api";

export default function CreateGoal() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    description: "",
    target_amount: "",
    goal_type: "personal",
    frequency: "weekly",
    creator_name: "",
    deadline: "",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // After creation, store the new goal + its invite code here
  const [created, setCreated] = useState(null);
  const [codeCopied, setCodeCopied] = useState(false);

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!form.name.trim()) return setError("Goal name is required");
    if (!form.creator_name.trim()) return setError("Your name is required");
    if (!form.target_amount || Number(form.target_amount) <= 0)
      return setError("Target amount must be a positive number");

    setSubmitting(true);
    try {
      const goal = await createGoal({
        ...form,
        target_amount: Number(form.target_amount),
        deadline: form.deadline || undefined,
      });

      if (goal.goal_type === "collaborative" && goal.invite_code) {
        // Store the code in localStorage so this creator can contribute without re-entering it
        localStorage.setItem(`savr_code_${goal.id}`, goal.invite_code);
        setCreated(goal);
      } else {
        navigate(`/goal/${goal.id}`);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  function copyCode() {
    navigator.clipboard.writeText(created.invite_code);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  }

  // --- Invite code reveal screen ---
  if (created) {
    return (
      <div className="create-goal">
        <div className="invite-reveal">
          <div className="invite-reveal-icon">&#128274;</div>
          <h1>Goal Created!</h1>
          <p className="subtitle">
            Share the invite code below with people you want to invite to{" "}
            <strong>{created.name}</strong>.
          </p>

          <div className="invite-code-box">
            <span className="invite-code-label">Invite Code</span>
            <div className="invite-code-value">{created.invite_code}</div>
            <button className="btn-secondary" onClick={copyCode}>
              {codeCopied ? "Copied!" : "Copy Code"}
            </button>
          </div>

          <div className="invite-instructions">
            <p>
              Anyone with this code can join and contribute to your goal. Keep it
              safe — it cannot be recovered from the app later.
            </p>
          </div>

          <button
            className="btn-primary btn-full"
            onClick={() => navigate(`/goal/${created.id}`)}
          >
            Go to Goal &rarr;
          </button>
        </div>
      </div>
    );
  }

  // --- Create goal form ---
  return (
    <div className="create-goal">
      <h1>Create a Savings Goal</h1>
      <p className="subtitle">Set a target and start saving in Bitcoin</p>

      <form onSubmit={handleSubmit} className="goal-form">
        {error && <div className="form-error">{error}</div>}

        <div className="form-group">
          <label htmlFor="name">Goal Name</label>
          <input
            id="name"
            type="text"
            placeholder="e.g., Emergency Fund, Group Trip"
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
          />
        </div>

        <div className="form-group">
          <label htmlFor="description">Description (optional)</label>
          <textarea
            id="description"
            placeholder="What are you saving for?"
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
            rows={3}
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="target">Target Amount (sats)</label>
            <input
              id="target"
              type="number"
              min="1"
              placeholder="100000"
              value={form.target_amount}
              onChange={(e) => update("target_amount", e.target.value)}
            />
          </div>
          <div className="form-group">
            <label htmlFor="creator">Your Name</label>
            <input
              id="creator"
              type="text"
              placeholder="Satoshi"
              value={form.creator_name}
              onChange={(e) => update("creator_name", e.target.value)}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="type">Goal Type</label>
            <select
              id="type"
              value={form.goal_type}
              onChange={(e) => update("goal_type", e.target.value)}
            >
              <option value="personal">Personal</option>
              <option value="collaborative">Collaborative</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="frequency">Saving Frequency</label>
            <select
              id="frequency"
              value={form.frequency}
              onChange={(e) => update("frequency", e.target.value)}
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
        </div>

        {form.goal_type === "collaborative" && (
          <div className="collab-notice">
            &#128274; An invite code will be generated. Share it with the people
            you want to contribute.
          </div>
        )}

        <div className="form-group">
          <label htmlFor="deadline">Deadline (optional)</label>
          <input
            id="deadline"
            type="date"
            value={form.deadline}
            onChange={(e) => update("deadline", e.target.value)}
          />
        </div>

        <button type="submit" className="btn-primary btn-full" disabled={submitting}>
          {submitting ? "Creating..." : "Create Goal"}
        </button>
      </form>
    </div>
  );
}
