const ALLOWED_ORIGIN = "https://lucastang.dev";
const REPO = "ricewas-mis-taken/lucastang.dev";
const CACHE_TTL_SECONDS = 900; // 15 min

const LEADERBOARD_KV_KEY = "entries";
const LEADERBOARD_MAX_ENTRIES = 100;
const LEADERBOARD_NAME_MAX = 5;

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

function relativeTime(isoDate) {
  const diffMs = Date.now() - new Date(isoDate).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 60) return `${Math.max(minutes, 1)}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

async function fetchGithubJson(url, token) {
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      "User-Agent": "lucastang-dev-worker",
      Accept: "application/vnd.github+json",
    },
  });
  if (!res.ok) throw new Error(`GitHub API ${res.status} for ${url}`);
  return res.json();
}

async function buildGithubPayload(env) {
  const [commitsRaw, repoRaw] = await Promise.all([
    fetchGithubJson(`https://api.github.com/repos/${REPO}/commits?per_page=3`, env.GITHUB_TOKEN),
    fetchGithubJson(`https://api.github.com/repos/${REPO}`, env.GITHUB_TOKEN),
  ]);

  const commits = commitsRaw.slice(0, 3).map((c) => ({
    sha: c.sha.slice(0, 7),
    message: c.commit.message.split("\n")[0],
    relativeTime: relativeTime(c.commit.committer.date),
  }));

  let contributions = [];
  try {
    const owner = REPO.split("/")[0];
    const contribRes = await fetch(`https://github-contributions-api.jogruber.de/v4/${owner}?y=last`);
    if (contribRes.ok) {
      const contribJson = await contribRes.json();
      contributions = contribJson.contributions || [];
    }
  } catch (e) {
    contributions = [];
  }

  return {
    commits,
    stars: repoRaw.stargazers_count,
    forks: repoRaw.forks_count,
    contributions,
  };
}

async function handleGithub(request, env, ctx) {
  const cache = caches.default;
  const cacheKey = new Request(request.url, request);

  const cached = await cache.match(cacheKey);
  if (cached) return cached;

  let payload;
  try {
    payload = await buildGithubPayload(env);
  } catch (e) {
    return new Response(JSON.stringify({ error: "upstream_failure" }), {
      status: 502,
      headers: { "Content-Type": "application/json", ...corsHeaders() },
    });
  }

  const response = new Response(JSON.stringify(payload), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": `public, max-age=${CACHE_TTL_SECONDS}`,
      ...corsHeaders(),
    },
  });

  ctx.waitUntil(cache.put(cacheKey, response.clone()));
  return response;
}

async function readLeaderboard(env) {
  const stored = await env.LEADERBOARD_KV.get(LEADERBOARD_KV_KEY, "json");
  return Array.isArray(stored) ? stored : [];
}

async function handleLeaderboardGet(env) {
  let entries;
  try {
    entries = await readLeaderboard(env);
  } catch (e) {
    // e.g. LEADERBOARD_KV isn't bound yet — the client falls back to its
    // own seed rows on any non-2xx response.
    return new Response(JSON.stringify({ error: "kv_unavailable" }), {
      status: 503,
      headers: { "Content-Type": "application/json", ...corsHeaders() },
    });
  }
  return new Response(JSON.stringify(entries), {
    status: 200,
    headers: { "Content-Type": "application/json", ...corsHeaders() },
  });
}

async function handleLeaderboardPost(request, env) {
  let body;
  try {
    body = await request.json();
  } catch (e) {
    return new Response(JSON.stringify({ error: "invalid_json" }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...corsHeaders() },
    });
  }

  const name = typeof body?.name === "string" ? body.name.trim().slice(0, LEADERBOARD_NAME_MAX) : "";
  const score = Number(body?.score);
  if (!name || !Number.isFinite(score)) {
    return new Response(JSON.stringify({ error: "invalid_entry" }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...corsHeaders() },
    });
  }

  let trimmed;
  try {
    const entries = await readLeaderboard(env);
    entries.push({ name, score });
    entries.sort((a, b) => b.score - a.score);
    trimmed = entries.slice(0, LEADERBOARD_MAX_ENTRIES);
    await env.LEADERBOARD_KV.put(LEADERBOARD_KV_KEY, JSON.stringify(trimmed));
  } catch (e) {
    return new Response(JSON.stringify({ error: "kv_unavailable" }), {
      status: 503,
      headers: { "Content-Type": "application/json", ...corsHeaders() },
    });
  }

  return new Response(JSON.stringify(trimmed), {
    status: 200,
    headers: { "Content-Type": "application/json", ...corsHeaders() },
  });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders() });
    }

    if (url.pathname === "/api/github" && request.method === "GET") {
      return handleGithub(request, env, ctx);
    }

    if (url.pathname === "/api/leaderboard" && request.method === "GET") {
      return handleLeaderboardGet(env);
    }

    if (url.pathname === "/api/leaderboard" && request.method === "POST") {
      return handleLeaderboardPost(request, env);
    }

    return new Response("Not found", { status: 404, headers: corsHeaders() });
  },
};
