// Same worker subdomain boot.js already uses live for GITHUB_API_URL; this
// specific /api/leaderboard route just needs to be deployed on it.
const LEADERBOARD_API_URL = "https://lucastang-dev-api.lucastang.workers.dev/api/leaderboard";

// Shown until the Worker's leaderboard endpoint is deployed (or if a visitor
// is offline), so the panel never renders empty.
const SEED_ENTRIES = Array.from({ length: 10 }, () => ({ name: "Lucas", score: 999999 }));

function ordinal(n) {
  const suffixes = ["TH", "ST", "ND", "RD"];
  const v = n % 100;
  return n + (suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0]);
}

async function loadLeaderboard() {
  try {
    const res = await fetch(LEADERBOARD_API_URL);
    if (!res.ok) throw new Error(`bad status ${res.status}`);
    const data = await res.json();
    if (Array.isArray(data) && data.length) return data;
  } catch (e) {
    // worker not deployed yet, offline, etc. — fall back to the seed rows
  }
  return SEED_ENTRIES;
}

function renderLeaderboard(entries) {
  const body = document.getElementById("leaderboard-body");
  if (!body) return;
  body.innerHTML = "";
  entries
    .slice()
    .sort((a, b) => b.score - a.score)
    .slice(0, 11)
    .forEach((entry, i) => {
      const tr = document.createElement("tr");
      const rank = document.createElement("td");
      rank.textContent = ordinal(i + 1);
      const name = document.createElement("td");
      name.textContent = entry.name;
      const score = document.createElement("td");
      score.textContent = entry.score;
      tr.append(rank, name, score);
      body.appendChild(tr);
    });
}

document.addEventListener("DOMContentLoaded", async () => {
  renderLeaderboard(await loadLeaderboard());
});
