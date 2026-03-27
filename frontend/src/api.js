const API_BASE = import.meta.env.VITE_API_URL || "http://127.0.0.1:5001";

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

export function fetchGoals() {
  return request("/api/goals");
}

export function fetchGoal(id) {
  return request(`/api/goals/${id}`);
}

export function createGoal(goal) {
  return request("/api/goals", {
    method: "POST",
    body: JSON.stringify(goal),
  });
}

export function contribute(goalId, contributorName, amount, inviteCode) {
  return request(`/api/goals/${goalId}/contribute`, {
    method: "POST",
    body: JSON.stringify({
      contributor_name: contributorName,
      amount,
      invite_code: inviteCode,
    }),
  });
}

export function verifyCode(goalId, inviteCode) {
  return request(`/api/goals/${goalId}/verify_code`, {
    method: "POST",
    body: JSON.stringify({ invite_code: inviteCode }),
  });
}

export function checkPayment(rHash) {
  return request(`/api/check_payment/${rHash}`);
}

export function fetchContributors(goalId) {
  return request(`/api/goals/${goalId}/contributors`);
}

export function fetchNodeInfo() {
  return request("/api/node_info");
}
