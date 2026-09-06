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

// Same storage pattern as the leaderboard: one JSON file on a dedicated
// data branch, read-modify-write via GitHub Contents API. Unlike the
// leaderboard, this file holds running *aggregate counters*, not an
// append-only log — the client (src/lib/analytics.js in excel-jam) batches
// its own events into deltas (one beacon per visibility-hidden/pagehide,
// plus a 60s heartbeat while a tab stays open) and this endpoint just adds
// each delta onto the totals. That keeps the file a fixed handful of
// fields forever regardless of traffic, instead of growing one row per
// session the way a raw event log would.
const ANALYTICS_BRANCH = "analytics-data";
const ANALYTICS_PATH = "analytics.json";
const ANALYTICS_CONTENTS_URL = `https://api.github.com/repos/${REPO}/contents/${ANALYTICS_PATH}`;
const ANALYTICS_MAX_ATTEMPTS = 3;
const ANALYTICS_GAME_KEYS = ["pacman", "galaga", "frogger", "roadgame", "tetris"];
// Clamp any single delta so one misbehaving/replayed beacon can't blow the
// totals out — a real heartbeat never exceeds HEARTBEAT_MS (60s) plus some
// slack for a backgrounded tab's timer being throttled.
const ANALYTICS_MAX_PLAY_SECONDS_PER_BEAT = 1800;
const ANALYTICS_MAX_COUNT_PER_BEAT = 20;
// Caps how many unique visitor ids we'll remember for the unique-player
// count. At jam scale this is generous headroom; if it's ever hit, unique
// visitors becomes an undercount (new ids stop being added) rather than
// the file growing without bound.
const ANALYTICS_MAX_VISITORS = 20000;

function emptyAnalytics() {
  const perGame = {};
  for (const key of ANALYTICS_GAME_KEYS) perGame[key] = { starts: 0, completions: 0 };
  return {
    totalSessions: 0,
    totalPlaySeconds: 0,
    uniqueVisitors: [],
    arcadeEntries: 0,
    bossWins: 0,
    competeRuns: 0,
    perGame,
    lastUpdated: null,
  };
}

// Trusts a freshly-fetched stored file about as little as the leaderboard
// does: a hand-edited or corrupted file shouldn't crash the endpoint or
// let NaN/garbage poison every future total.
function sanitizeAnalytics(raw) {
  const base = emptyAnalytics();
  if (!raw || typeof raw !== "object") return base;
  const clean = { ...base };
  if (Number.isFinite(raw.totalSessions)) clean.totalSessions = Math.max(0, Math.floor(raw.totalSessions));
  if (Number.isFinite(raw.totalPlaySeconds)) clean.totalPlaySeconds = Math.max(0, Math.floor(raw.totalPlaySeconds));
  if (Number.isFinite(raw.arcadeEntries)) clean.arcadeEntries = Math.max(0, Math.floor(raw.arcadeEntries));
  if (Number.isFinite(raw.bossWins)) clean.bossWins = Math.max(0, Math.floor(raw.bossWins));
  if (Number.isFinite(raw.competeRuns)) clean.competeRuns = Math.max(0, Math.floor(raw.competeRuns));
  if (Array.isArray(raw.uniqueVisitors)) {
    clean.uniqueVisitors = raw.uniqueVisitors.filter((id) => typeof id === "string").slice(0, ANALYTICS_MAX_VISITORS);
  }
  if (raw.perGame && typeof raw.perGame === "object") {
    for (const key of ANALYTICS_GAME_KEYS) {
      const g = raw.perGame[key];
      clean.perGame[key] = {
        starts: g && Number.isFinite(g.starts) ? Math.max(0, Math.floor(g.starts)) : 0,
        completions: g && Number.isFinite(g.completions) ? Math.max(0, Math.floor(g.completions)) : 0,
      };
    }
  }
  if (typeof raw.lastUpdated === "string") clean.lastUpdated = raw.lastUpdated;
  return clean;
}

function clampCount(n) {
  return Math.max(0, Math.min(ANALYTICS_MAX_COUNT_PER_BEAT, Math.floor(Number(n) || 0)));
}

// Applies one client beacon's delta onto the stored totals in place.
function applyAnalyticsDelta(stats, body, visitorId) {
  const playSeconds = Math.max(0, Math.min(ANALYTICS_MAX_PLAY_SECONDS_PER_BEAT, Math.floor(Number(body.playSecondsDelta) || 0)));
  stats.totalPlaySeconds += playSeconds;

  if (body.sessionNew) stats.totalSessions += 1;

  if (visitorId && stats.uniqueVisitors.length < ANALYTICS_MAX_VISITORS && !stats.uniqueVisitors.includes(visitorId)) {
    stats.uniqueVisitors.push(visitorId);
  }

  stats.arcadeEntries += clampCount(body.arcadeEnteredDelta);
  stats.bossWins += clampCount(body.bossWinsDelta);
  stats.competeRuns += clampCount(body.competeRunsDelta);

  if (body.gameStarts && typeof body.gameStarts === "object") {
    for (const key of ANALYTICS_GAME_KEYS) {
      if (body.gameStarts[key] != null) stats.perGame[key].starts += clampCount(body.gameStarts[key]);
    }
  }
  if (body.gameCompletions && typeof body.gameCompletions === "object") {
    for (const key of ANALYTICS_GAME_KEYS) {
      if (body.gameCompletions[key] != null) stats.perGame[key].completions += clampCount(body.gameCompletions[key]);
    }
  }

  stats.lastUpdated = new Date().toISOString();
  return stats;
}

async function handleAnalyticsGet(env) {
  try {
    const res = await fetch(`${ANALYTICS_CONTENTS_URL}?ref=${ANALYTICS_BRANCH}`, {
      headers: githubHeaders(env.GITHUB_TOKEN),
    });
    if (res.status === 404) {
      return new Response(JSON.stringify(emptyAnalytics()), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders() },
      });
    }
    if (!res.ok) throw new Error(`contents fetch ${res.status}`);
    const file = await res.json();
    const stats = sanitizeAnalytics(JSON.parse(base64ToUtf8(file.content)));
    // uniqueVisitors is an internal implementation detail (raw ids), not
    // something the public stats page needs — expose only its count.
    const { uniqueVisitors, ...publicStats } = stats;
    return new Response(JSON.stringify({ ...publicStats, uniqueVisitorCount: uniqueVisitors.length }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=30",
        ...corsHeaders(),
      },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: "analytics_unavailable" }), {
      status: 503,
      headers: { "Content-Type": "application/json", ...corsHeaders() },
    });
  }
}

async function handleAnalyticsPost(request, env) {
  let body;
  try {
    body = await request.json();
  } catch (e) {
    // sendBeacon can't set a Content-Type reliably in every browser, so a
    // malformed/empty body is expected background noise, not an error
    // worth surfacing — just drop the beat.
    return new Response(null, { status: 204, headers: corsHeaders() });
  }

  const visitorId = typeof body?.visitorId === "string" ? body.visitorId.slice(0, 100) : null;
  const headers = githubHeaders(env.GITHUB_TOKEN);

  try {
    let putRes;
    for (let attempt = 0; attempt < ANALYTICS_MAX_ATTEMPTS; attempt++) {
      let stats = emptyAnalytics();
      let sha;
      const getRes = await fetch(`${ANALYTICS_CONTENTS_URL}?ref=${ANALYTICS_BRANCH}`, { headers });
      if (getRes.ok) {
        const file = await getRes.json();
        sha = file.sha;
        stats = sanitizeAnalytics(JSON.parse(base64ToUtf8(file.content)));
      } else if (getRes.status !== 404) {
        throw new Error(`github get ${getRes.status}`);
      }

      applyAnalyticsDelta(stats, body, visitorId);

      putRes = await fetch(ANALYTICS_CONTENTS_URL, {
        method: "PUT",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({
          message: "analytics: record usage beat",
          content: utf8ToBase64(JSON.stringify(stats, null, 2)),
          branch: ANALYTICS_BRANCH,
          ...(sha ? { sha } : {}),
        }),
      });
      if (putRes.ok) break;
      if (putRes.status !== 409 || attempt === ANALYTICS_MAX_ATTEMPTS - 1) {
        throw new Error(`github put ${putRes.status}`);
      }
    }
  } catch (e) {
    // Fire-and-forget from the client's perspective (sendBeacon has no
    // response callback), so there's no retry benefit to a non-204 here —
    // but keep the real status for direct/manual POSTs and server logs.
    return new Response(null, { status: 503, headers: corsHeaders() });
  }

  return new Response(null, { status: 204, headers: corsHeaders() });
}

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

    if (url.pathname === "/api/analytics" && request.method === "GET") {
      return handleAnalyticsGet(env);
    }

    if (url.pathname === "/api/analytics" && request.method === "POST") {
      return handleAnalyticsPost(request, env);
    }

    return new Response("Not found", { status: 404, headers: corsHeaders() });
  },
};
