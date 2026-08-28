const ALLOWED_ORIGIN = "https://lucastang.dev";
const REPO = "ricewas-mis-taken/lucastang.dev";
const CACHE_TTL_SECONDS = 900; // 15 min

// Leaderboard entries live as a JSON file committed to a dedicated data-only
// branch of this same repo (not `main`, so a score submission never
// triggers a Pages rebuild and never pollutes real commit history). Both
// reads and writes go through GitHub's Contents API (not the raw CDN, which
// caches for several minutes and could show a stale list right after a
// write). Reuses GITHUB_TOKEN — the `public_repo` scope it already has for
// the commit/star widget includes write access to code on public repos, so
// no new secret or Cloudflare resource is needed.
const LEADERBOARD_BRANCH = "leaderboard-data";
const LEADERBOARD_PATH = "leaderboard.json";
const LEADERBOARD_CONTENTS_URL = `https://api.github.com/repos/${REPO}/contents/${LEADERBOARD_PATH}`;
const LEADERBOARD_MAX_ENTRIES = 100;
const LEADERBOARD_NAME_MAX = 5;
// Retries a PUT that lost a sha race against a concurrent submission (see
// handleLeaderboardPost) instead of dropping the score.
const LEADERBOARD_MAX_ATTEMPTS = 3;

function githubHeaders(token) {
  return {
    Authorization: `Bearer ${token}`,
    "User-Agent": "lucastang-dev-worker",
    Accept: "application/vnd.github+json",
  };
}

// Existing entries are trusted less than the one being submitted right now
// (which handleLeaderboardPost already validates): the stored file could in
// principle be hand-edited or corrupted, and a non-numeric score would make
// the sort comparator return NaN and silently scramble every ranking.
function sanitizeEntries(entries) {
  if (!Array.isArray(entries)) return [];
  return entries.filter((e) => e && typeof e.name === "string" && Number.isFinite(e.score));
}

function utf8ToBase64(str) {
  return btoa(unescape(encodeURIComponent(str)));
}

function base64ToUtf8(b64) {
  return decodeURIComponent(escape(atob(b64.replace(/\n/g, ""))));
}

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

async function handleLeaderboardGet(env) {
  try {
    const res = await fetch(`${LEADERBOARD_CONTENTS_URL}?ref=${LEADERBOARD_BRANCH}`, {
      headers: githubHeaders(env.GITHUB_TOKEN),
    });
    if (res.status === 404) {
      // Branch/file not created yet — the client falls back to its own
      // seed rows on an empty list, same as any other empty leaderboard.
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders() },
      });
    }
    if (!res.ok) throw new Error(`contents fetch ${res.status}`);
    const file = await res.json();
    const entries = sanitizeEntries(JSON.parse(base64ToUtf8(file.content)));
    return new Response(JSON.stringify(entries), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders() },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: "leaderboard_unavailable" }), {
      status: 503,
      headers: { "Content-Type": "application/json", ...corsHeaders() },
    });
  }
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

  const headers = githubHeaders(env.GITHUB_TOKEN);

  let trimmed;
  try {
    // Retries on a 409 (another submission's PUT landed first and moved the
    // sha out from under us) by re-fetching the now-current sha/entries and
    // re-attempting, instead of failing the request and silently dropping
    // this score.
    let putRes;
    for (let attempt = 0; attempt < LEADERBOARD_MAX_ATTEMPTS; attempt++) {
      let entries = [];
      let sha;
      const getRes = await fetch(`${LEADERBOARD_CONTENTS_URL}?ref=${LEADERBOARD_BRANCH}`, { headers });
      if (getRes.ok) {
        const file = await getRes.json();
        sha = file.sha;
        entries = sanitizeEntries(JSON.parse(base64ToUtf8(file.content)));
      } else if (getRes.status !== 404) {
        throw new Error(`github get ${getRes.status}`);
      }

      entries.push({ name, score });
      entries.sort((a, b) => b.score - a.score);
      trimmed = entries.slice(0, LEADERBOARD_MAX_ENTRIES);

      putRes = await fetch(LEADERBOARD_CONTENTS_URL, {
        method: "PUT",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `leaderboard: add ${name} (${score})`,
          content: utf8ToBase64(JSON.stringify(trimmed, null, 2)),
          branch: LEADERBOARD_BRANCH,
          ...(sha ? { sha } : {}),
        }),
      });
      if (putRes.ok) break;
      if (putRes.status !== 409 || attempt === LEADERBOARD_MAX_ATTEMPTS - 1) {
        throw new Error(`github put ${putRes.status}`);
      }
    }
  } catch (e) {
    return new Response(JSON.stringify({ error: "leaderboard_unavailable" }), {
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
