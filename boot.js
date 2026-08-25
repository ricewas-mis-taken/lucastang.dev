/* ==========================================================================
   lucastang.dev — boot/desktop intro sequence
   Timing constants are grouped here so the whole sequence can be re-tuned
   without hunting through the scene functions below.
   ========================================================================== */

const TIMING = {
  flicker: 1100,        // Scene 1 flicker duration (must match CSS .flicker animation)
  bootSplash: 1700,      // Scene 1 spinner duration
  zoom: 1400,            // Scene 2 camera push-in (must match CSS #stage transition)
  crossfade: 600,        // Scene 3 photo -> rendered screen crossfade
  typeSpeed: 18,         // ms per character in the code editor
  lineDelay: 350,        // ms pause between typed lines
  terminalEvery: 6,      // show a terminal interlude every N code lines
  terminalLineDelay: 450,// ms between typed terminal lines
  terminalHold: 1600,    // ms terminal stays up after commands finish
  loopPause: 1200,       // ms pause between desktop-loop cycles
};

const CODE_LINES = [
  { html: '<span class="kw">const</span> stage = document.<span class="fn">querySelector</span>(<span class="str">"#stage"</span>);' },
  { html: '<span class="kw">function</span> <span class="fn">triggerBoot</span>() {' },
  { html: '  <span class="kw">if</span> (booted) <span class="kw">return</span>;' },
  { html: '  stage.<span class="fn">classList</span>.add(<span class="str">"zoomed"</span>);' },
  { html: '  <span class="cm">// crossfade photo into rendered UI</span>' },
  { html: '}' },
  { html: '' },
  { html: '<span class="kw">async function</span> <span class="fn">typeLine</span>(el, text) {' },
  { html: '  <span class="kw">for</span> (<span class="kw">const</span> ch <span class="kw">of</span> text) {' },
  { html: '    el.textContent += ch;' },
  { html: '    <span class="kw">await</span> <span class="fn">sleep</span>(<span class="num">18</span>);' },
  { html: '  }' },
  { html: '}' },
  { html: '' },
  { html: '<span class="kw">window</span>.<span class="fn">addEventListener</span>(<span class="str">"wheel"</span>, triggerBoot, { once: <span class="kw">true</span> });' },
];

const TERMINAL_COMMANDS = [
  { cmd: "git add .", out: null },
  { cmd: 'git commit -m "update site"', out: "[main a1b2c3d] update site" },
  { cmd: "git push origin main", out: "main -> main\nDone." },
];

// Fractional screen bounds within assets/desk-photo.png (1448x1086),
// measured against the actual bezel edges. Positioned in boot.js (not
// fixed CSS %) because the true on-screen box depends on how object-fit:
// cover crops the photo for the current viewport aspect ratio.
const SCREENS = {
  top: { x: 0.3059, y: 0.3279, w: 0.2573, h: 0.1818 },
  bottom: { x: 0.2807, y: 0.5187, w: 0.3045, h: 0.2150 },
};

// Column count for the contribution graph — matched to the fallback grid's
// density since the pane is a fixed, narrow width regardless of how many
// weeks the API returns.
const GRAPH_WEEKS = 20;

const MAX_DESK_BLUR = 6; // px, applied at full scroll-in (scale = ZOOM_MAX)

// Extra px the monitor overlay boxes are padded outward by, so the opaque
// overlay swallows any blurred/misaligned bezel edge instead of leaving a
// blurred sliver of the photo visible around the screen.
const BEZEL_PAD = 2;

// The desk photo itself is shot at a slight tilt, so neither monitor's
// bezel is perfectly axis-aligned. Hand-tuned via calibrate.html — see that
// file for a drag-to-fit tool that outputs these values directly.
const TOP_TILT_DEG = 0;
const BOTTOM_TILT_DEG = 0;

// Keystone: for when the *physical* monitor itself sat angled toward/away
// from the camera (not just in-plane rotated) — rendered as a CSS 3D
// rotateX, which tapers the top or bottom edge like real camera perspective
// instead of just spinning the rectangle. 0 = no correction (default).
const TOP_KEYSTONE_DEG = -11.0;
const BOTTOM_KEYSTONE_DEG = 9.0;
const KEYSTONE_PERSPECTIVE_PX = 900;

// Static snapshot of the real playlist (id 33zDbT2VaLbq6yCFW05piK) — track
// name/artist/album-art/preview clip pulled directly from Spotify's public
// embed + track pages. No live API/Worker call at runtime.
const TRACKS = [
  { title: "Ordinary", artist: "Alex Warren", art: "https://i.scdn.co/image/ab67616d0000b273457cfd5a54720ab3b0820064", preview: "https://p.scdn.co/mp3-preview/b9c15f51650b7b58e9ef7f7eae211af32f6199fb" },
  { title: "Ghost", artist: "Justin Bieber", art: "https://i.scdn.co/image/ab67616d0000b273e6f407c7f3a0ec98845e4431", preview: "https://p.scdn.co/mp3-preview/10746d0627d5dd428001083030cf6726c5e92c67" },
  { title: "10:35", artist: "Tiësto, Tate McRae", art: "https://i.scdn.co/image/ab67616d0000b2735a40a12ce225ba2783d05993", preview: "https://p.scdn.co/mp3-preview/1682a16f43eae87473a7539ac722d892b6a90b30" },
  { title: "Grateful", artist: "NEFFEX", art: "https://i.scdn.co/image/ab67616d0000b2733df78c12a8c2886098289a65", preview: "https://p.scdn.co/mp3-preview/89e10f902eceb9c9da51f49d18f9d5c3aed3ac43" },
  { title: "Legends Are Made", artist: "Sam Tinnesz", art: "https://i.scdn.co/image/ab67616d0000b273bcd796a0a9731fe5a6ef13ea", preview: "https://p.scdn.co/mp3-preview/a625680c99c63c2bb17fa819b18311aff4ef9369" },
  { title: "Something Just Like This", artist: "The Chainsmokers, Coldplay", art: "https://i.scdn.co/image/ab67616d0000b2730c13d3d5a503c84fcc60ae94", preview: "https://p.scdn.co/mp3-preview/4e117abe76700eb13e9e0557fa2d9c44b565b9da" },
  { title: "Counting Stars", artist: "OneRepublic", art: "https://i.scdn.co/image/ab67616d0000b273e80e7dbce3996a1ae5967751", preview: "https://p.scdn.co/mp3-preview/6316f6cf12631da62c5b786421b25e66c3ab4ea6" },
  { title: "Hall of Fame (feat. will.i.am)", artist: "The Script, will.i.am", art: "https://i.scdn.co/image/ab67616d0000b27344287246ea331e6f7b0ef8a9", preview: "https://p.scdn.co/mp3-preview/1b08a41550e7412dff0f17436f3a6100f821ee67" },
  { title: "The Nights", artist: "Avicii", art: "https://i.scdn.co/image/ab67616d0000b2730ae4f4d42e4a09f3a29f64ad", preview: "https://p.scdn.co/mp3-preview/7866e9567e7398035a01f663104ea1c5c28d11b1" },
  { title: "Centuries", artist: "Fall Out Boy", art: "https://i.scdn.co/image/ab67616d0000b2733cf1c1dbcfa3f1ab7282719b", preview: "https://p.scdn.co/mp3-preview/d6fcac6047be8c069b563701022ce2713d7c05cf" },
];

// lucastang.dev's DNS points directly at GitHub Pages (not proxied through
// Cloudflare), so a Worker route on lucastang.dev/api/* would never fire.
// Call the Worker's own *.workers.dev subdomain instead — the Worker's CORS
// headers (see worker/src/index.js) allow this origin explicitly.
// Replace with the actual subdomain after `wrangler deploy`.
const GITHUB_API_URL = "https://lucastang-dev-api.lucastang.workers.dev/api/github";

// Used only if the /api/github fetch fails (offline, Worker not deployed
// yet, rate-limited, etc.) so the panel never renders empty.
const STUB_GH_DATA = {
  commits: [
    { sha: "a1b2c3d", message: "Fix monitor alignment", relativeTime: "2h" },
    { sha: "9f8e7d6", message: "Add boot sequence", relativeTime: "1d" },
    { sha: "5c4b3a2", message: "Update styles", relativeTime: "3d" },
  ],
  stars: 128,
  forks: 24,
  contributions: [],
};

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Replicates the browser's object-fit:cover math: scale the source to fill
// the container on its shorter axis, center-crop the overflow on the other.
function computeCoverRect(containerW, containerH, naturalW, naturalH) {
  const containerAspect = containerW / containerH;
  const photoAspect = naturalW / naturalH;
  let renderW, renderH, renderX, renderY;
  if (containerAspect > photoAspect) {
    renderW = containerW;
    renderH = containerW / photoAspect;
    renderX = 0;
    renderY = (containerH - renderH) / 2;
  } else {
    renderH = containerH;
    renderW = containerH * photoAspect;
    renderY = 0;
    renderX = (containerW - renderW) / 2;
  }
  return { renderX, renderY, renderW, renderH };
}

document.addEventListener("DOMContentLoaded", () => {
  const stage = document.getElementById("stage");
  const deskPhoto = document.getElementById("desk-photo");
  const topOverlay = document.getElementById("top-monitor");
  const bottomOverlay = document.getElementById("bottom-monitor");
  const bootSplashes = document.querySelectorAll(".boot-splash");
  const screenContents = document.querySelectorAll(".screen-content");
  const codeGutter = document.querySelector("#code-editor .gutter");
  const codeBody = document.querySelector("#code-editor .code-body");
  const terminalPanel = document.getElementById("terminal-panel");
  const scrollHint = document.getElementById("scroll-hint");

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const ZOOM_MIN = 1;
  const ZOOM_MAX_DEFAULT = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--zoom-scale")) || 2.6;
  // Mutable: narrowed by refreshZoomBounds() once real layout/photo geometry
  // is known, so scrolling in never crops a monitor out of frame.
  let ZOOM_MAX = ZOOM_MAX_DEFAULT;

  // `generation` invalidates any in-flight async scene loops when the
  // sequence is reset (e.g. bfcache restore on back-navigation) without
  // needing every await to be manually cancelled.
  let generation = 0;
  let booted = false;
  let triggered = false;
  // Tracks #stage's actual current zoom (read by the wheel handler and by
  // updateMonitorPositions() to keep the overlay layer in sync on resize).
  // Starts at ZOOM_MIN, not ZOOM_MAX: #stage has no scale applied at all
  // until Scene 2 runs, so this must reflect what's really on screen right
  // now, not the value Scene 2 will eventually animate to.
  let sceneZoom = ZOOM_MIN;

  // Overlay geometry at zoom = 1 (i.e. the position/size they'd have with no
  // camera push-in at all). applyOverlayZoom() scales these live against the
  // current zoom level instead of relying on a shared CSS transform, so the
  // screens' text/UI is always laid out at its true final size — see the
  // comments in index.html and style.css for why.
  const baseRects = { top: null, bottom: null };

  // ---------- Monitor screen alignment (object-fit:cover math) ----------
  function updateMonitorPositions() {
    if (!deskPhoto.naturalWidth) return;
    const stageW = stage.offsetWidth;
    const stageH = stage.offsetHeight;
    const { renderX, renderY, renderW, renderH } = computeCoverRect(
      stageW,
      stageH,
      deskPhoto.naturalWidth,
      deskPhoto.naturalHeight
    );
    // Shrinks the box on each axis by exactly the amount its rotated
    // bounding box would otherwise grow by, so a rotated overlay's corners
    // still land inside the unrotated bezel footprint: for a W x H box
    // rotated by angle a, the axis-aligned bbox is
    //   bboxW = W*cos(a) + H*sin(a), bboxH = W*sin(a) + H*cos(a)
    // and shrinking each axis by W/bboxW (H/bboxH) cancels that growth.
    const place = (frac, opts) => {
      const angleDeg = (opts && opts.rotateDeg) || 0;
      const keystoneDeg = (opts && opts.keystoneDeg) || 0;
      const fullW = frac.w * renderW + BEZEL_PAD * 2;
      const fullH = frac.h * renderH + BEZEL_PAD * 2;
      let w = fullW;
      let h = fullH;
      if (angleDeg) {
        const rad = Math.abs(angleDeg) * (Math.PI / 180);
        const bboxW = fullW * Math.cos(rad) + fullH * Math.sin(rad);
        const bboxH = fullW * Math.sin(rad) + fullH * Math.cos(rad);
        w = fullW * (fullW / bboxW);
        h = fullH * (fullH / bboxH);
      }
      return {
        left: renderX + frac.x * renderW - BEZEL_PAD + (fullW - w) / 2,
        top: renderY + frac.y * renderH - BEZEL_PAD + (fullH - h) / 2,
        w,
        h,
        angleDeg,
        keystoneDeg,
      };
    };
    baseRects.top = place(SCREENS.top, { rotateDeg: TOP_TILT_DEG, keystoneDeg: TOP_KEYSTONE_DEG });
    baseRects.bottom = place(SCREENS.bottom, { rotateDeg: BOTTOM_TILT_DEG, keystoneDeg: BOTTOM_KEYSTONE_DEG });
    // Keystone/rotate are angle-only, independent of zoom scale, so they can
    // be applied to the element once here rather than on every zoom tick.
    const applyAngle = (el, rect) => {
      const transformParts = [];
      if (rect.keystoneDeg) transformParts.push(`perspective(${KEYSTONE_PERSPECTIVE_PX}px) rotateX(${rect.keystoneDeg}deg)`);
      if (rect.angleDeg) transformParts.push(`rotate(${rect.angleDeg}deg)`);
      el.style.transform = transformParts.join(" ");
      el.style.transformOrigin = "center center";
    };
    applyAngle(topOverlay, baseRects.top);
    applyAngle(bottomOverlay, baseRects.bottom);
    refreshZoomBounds();
    // Not just applyOverlayZoom(): refreshZoomBounds() can clamp sceneZoom
    // down (e.g. on a resize that shrinks ZOOM_MAX), and if only the overlay
    // re-synced to that new value while #stage's transform kept its old,
    // larger scale, the two would visibly desync — the exact "overlay box
    // too big for the photo" bug. applySceneZoom() re-asserts both together.
    applySceneZoom(sceneZoom);
  }

  // Rescales the overlay boxes' real left/top/width/height to match the
  // given zoom level, around the same transform-origin point #stage scales
  // around — geometrically identical to what `transform: scale(zoom)` would
  // do, but computed here so the browser lays out/paints the content at its
  // true target size instead of stretching a pre-rendered bitmap.
  function applyOverlayZoom(zoom) {
    if (!baseRects.top || !baseRects.bottom) return;
    const stageW = stage.offsetWidth;
    const stageH = stage.offsetHeight;
    if (!stageW || !stageH) return;
    const rootStyle = getComputedStyle(document.documentElement);
    const originX = (parseFloat(rootStyle.getPropertyValue("--cluster-cx")) / 100) * stageW;
    const originY = (parseFloat(rootStyle.getPropertyValue("--cluster-cy")) / 100) * stageH;
    const applyOne = (el, rect) => {
      el.style.left = `${originX + (rect.left - originX) * zoom}px`;
      el.style.top = `${originY + (rect.top - originY) * zoom}px`;
      el.style.width = `${rect.w * zoom}px`;
      el.style.height = `${rect.h * zoom}px`;
    };
    applyOne(topOverlay, baseRects.top);
    applyOne(bottomOverlay, baseRects.bottom);
  }

  // Computes how far scroll-in can zoom before either monitor's overlay box
  // would be pushed outside the viewport by the #stage scale (transform
  // origin = cluster center), so scrolling in always leaves both monitors
  // fully in frame instead of cropping one off at the tight end.
  function computeMaxZoomInFrame() {
    const stageW = stage.offsetWidth;
    const stageH = stage.offsetHeight;
    if (!stageW || !stageH) return ZOOM_MAX_DEFAULT;

    const rootStyle = getComputedStyle(document.documentElement);
    const originX = (parseFloat(rootStyle.getPropertyValue("--cluster-cx")) / 100) * stageW;
    const originY = (parseFloat(rootStyle.getPropertyValue("--cluster-cy")) / 100) * stageH;

    let maxScale = Infinity;
    const consider = (p, o, bound) => {
      if (p === o) return;
      const s = p > o ? (bound - o) / (p - o) : (0 - o) / (p - o);
      if (s < maxScale) maxScale = s;
    };

    [baseRects.top, baseRects.bottom].forEach((rect) => {
      if (!rect) return;
      [rect.left, rect.left + rect.w].forEach((x) => consider(x, originX, stageW));
      [rect.top, rect.top + rect.h].forEach((y) => consider(y, originY, stageH));
    });

    return Math.min(ZOOM_MAX_DEFAULT, maxScale);
  }

  function refreshZoomBounds() {
    const computed = computeMaxZoomInFrame();
    if (computed && isFinite(computed) && computed > ZOOM_MIN) {
      ZOOM_MAX = computed;
      document.documentElement.style.setProperty("--zoom-scale", ZOOM_MAX.toFixed(4));
      if (sceneZoom > ZOOM_MAX) sceneZoom = ZOOM_MAX;
    }
  }

  if (deskPhoto.complete && deskPhoto.naturalWidth) {
    updateMonitorPositions();
  } else {
    deskPhoto.addEventListener("load", updateMonitorPositions, { once: true });
  }
  window.addEventListener("resize", updateMonitorPositions);

  // ---------- Scroll-driven whole-scene zoom + depth-of-field blur ----------
  // The single place that writes the photo's transform AND the overlay
  // layer's geometry — always together, in the same synchronous call, from
  // the same zoom number. Every animation path below (Scene 2's push-in,
  // scroll-driven zoom) ultimately just calls this repeatedly; there's no
  // second, independently-timed animation system (e.g. a CSS transition)
  // that could drift out of step with it.
  function applySceneZoom(zoom) {
    sceneZoom = zoom;
    stage.style.transform = `scale(${zoom})`;
    applyOverlayZoom(zoom);
    // Wide shot (scrolled all the way out, zoom = ZOOM_MIN) is fully sharp;
    // blur eases in gradually as you scroll/zoom in toward the monitors,
    // like a shallow depth of field settling on the screens.
    const t = (zoom - ZOOM_MIN) / (ZOOM_MAX - ZOOM_MIN);
    deskPhoto.style.filter = `blur(${MAX_DESK_BLUR * t}px)`;
  }

  // Standard cubic-bezier(x1,y1,x2,y2) progress-easing evaluator (Newton-
  // Raphson), matching the curve the CSS transition used to use — so Scene
  // 2's push-in still has the same "fast start, gentle settle" feel.
  function cubicBezier(x1, y1, x2, y2) {
    const A = (a1, a2) => 1 - 3 * a2 + 3 * a1;
    const B = (a1, a2) => 3 * a2 - 6 * a1;
    const C = (a1) => 3 * a1;
    const calc = (t, a1, a2) => ((A(a1, a2) * t + B(a1, a2)) * t + C(a1)) * t;
    const slope = (t, a1, a2) => 3 * A(a1, a2) * t * t + 2 * B(a1, a2) * t + C(a1);
    return (t) => {
      let x = t;
      for (let i = 0; i < 8; i++) {
        const s = slope(x, x1, x2);
        if (s === 0) break;
        x -= (calc(x, x1, x2) - t) / s;
      }
      return calc(x, y1, y2);
    };
  }
  const zoomEase = cubicBezier(0.62, 0, 0.3, 1);

  // Bumped to cancel any in-flight animateZoomTo() loop — e.g. when the user
  // scrolls mid push-in, taking manual control should win immediately
  // rather than fighting the animation for the next several frames.
  let zoomAnimToken = 0;

  // Animates sceneZoom from its current value to `target` over `durationMs`,
  // driving #stage's transform and the overlay layer from the same rAF loop
  // every frame (via applySceneZoom) so they're always in lockstep by
  // construction — there's nothing else that could pull them apart.
  function animateZoomTo(target, durationMs, myGen) {
    zoomAnimToken++;
    const myToken = zoomAnimToken;
    const startZoom = sceneZoom;
    const startTime = performance.now();
    return new Promise((resolve) => {
      function frame(now) {
        if (myGen !== generation || myToken !== zoomAnimToken) {
          resolve(false);
          return;
        }
        const t = Math.min(1, (now - startTime) / durationMs);
        applySceneZoom(startZoom + (target - startZoom) * zoomEase(t));
        if (t < 1) {
          requestAnimationFrame(frame);
        } else {
          resolve(true);
        }
      }
      requestAnimationFrame(frame);
    });
  }

  function resetToScene0() {
    generation++;
    booted = false;
    triggered = false;
    zoomAnimToken++;
    document.body.classList.remove("booted");
    applySceneZoom(ZOOM_MIN);
    topOverlay.classList.remove("flicker");
    bottomOverlay.classList.remove("flicker");
    bootSplashes.forEach((el) => el.classList.remove("visible"));
    screenContents.forEach((el) => el.classList.remove("visible"));
    terminalPanel.classList.remove("visible");
    terminalPanel.innerHTML = "";
    codeGutter.innerHTML = "";
    codeBody.innerHTML = "";
    codeBody.parentElement.style.opacity = "1";
  }

  function goDirectlyToFinalState() {
    const myGen = generation;
    document.body.classList.add("booted");
    booted = true;
    triggered = true;
    zoomAnimToken++;
    applySceneZoom(ZOOM_MAX);
    topOverlay.classList.remove("flicker");
    bottomOverlay.classList.remove("flicker");
    screenContents.forEach((el) => el.classList.add("visible"));
    fetchAndRenderGh();
    initSpotifyWidget();
    startDesktopLoop(myGen);
  }

  function triggerBoot() {
    if (booted) return;
    booted = true;
    document.body.classList.add("booted");
    runSequence(generation);
  }

  async function runSequence(myGen) {
    // Scene 1 — boot flicker + splash
    topOverlay.classList.add("flicker");
    bottomOverlay.classList.add("flicker");
    await sleep(TIMING.flicker);
    if (myGen !== generation) return;

    bootSplashes.forEach((el) => el.classList.add("visible"));
    await sleep(TIMING.bootSplash);
    if (myGen !== generation) return;
    bootSplashes.forEach((el) => el.classList.remove("visible"));

    // Scene 2 — camera zoom (rAF-driven push-in to the tight monitor frame;
    // see animateZoomTo() — drives the photo and overlay from one shared
    // zoom value every frame, so they can't drift apart mid-animation).
    const completed = await animateZoomTo(ZOOM_MAX, TIMING.zoom, myGen);
    if (!completed) return;

    // Scene 3 — crossfade to rendered desktop
    screenContents.forEach((el) => el.classList.add("visible"));
    fetchAndRenderGh();
    initSpotifyWidget();
    await sleep(TIMING.crossfade);
    if (myGen !== generation) return;

    startDesktopLoop(myGen);
  }

  async function typeCodeLines(myGen) {
    codeGutter.textContent = "";
    codeBody.innerHTML = "";
    for (let i = 0; i < CODE_LINES.length; i++) {
      if (myGen !== generation) return;
      const lineEl = document.createElement("div");
      codeBody.appendChild(lineEl);
      const gutterLine = document.createElement("div");
      gutterLine.textContent = i + 1;
      codeGutter.appendChild(gutterLine);

      await typeHtmlLine(lineEl, CODE_LINES[i].html, myGen);
      if (myGen !== generation) return;
      await sleep(TIMING.lineDelay);
      if (myGen !== generation) return;

      if ((i + 1) % TIMING.terminalEvery === 0) {
        await runTerminalInterlude(myGen);
        if (myGen !== generation) return;
      }
    }
  }

  // Types an HTML-bearing line char-by-char without breaking tags: reveals
  // the target markup progressively by growing a slice of the source string.
  async function typeHtmlLine(el, html, myGen) {
    const plain = html.replace(/<[^>]+>/g, "");
    let shown = 0;
    for (let i = 0; i < plain.length; i++) {
      shown++;
      el.innerHTML = revealHtml(html, shown);
      await sleep(TIMING.typeSpeed);
      if (myGen !== generation) return;
    }
    el.innerHTML = html;
  }

  function revealHtml(html, charCount) {
    let out = "";
    let shown = 0;
    let i = 0;
    while (i < html.length && shown < charCount) {
      if (html[i] === "<") {
        const close = html.indexOf(">", i);
        out += html.slice(i, close + 1);
        i = close + 1;
      } else {
        out += html[i];
        shown++;
        i++;
      }
    }
    return out;
  }

  async function runTerminalInterlude(myGen) {
    codeBody.parentElement.style.opacity = "0";
    terminalPanel.innerHTML = "";
    terminalPanel.classList.add("visible");
    await sleep(200);
    if (myGen !== generation) return;

    for (const step of TERMINAL_COMMANDS) {
      if (myGen !== generation) return;
      const line = document.createElement("div");
      const prompt = document.createElement("span");
      prompt.className = "prompt";
      prompt.textContent = "$ ";
      line.appendChild(prompt);
      const cmdText = document.createElement("span");
      line.appendChild(cmdText);
      terminalPanel.appendChild(line);

      for (const ch of step.cmd) {
        cmdText.textContent += ch;
        await sleep(TIMING.typeSpeed);
        if (myGen !== generation) return;
      }
      await sleep(TIMING.terminalLineDelay);
      if (myGen !== generation) return;

      if (step.out) {
        const outLine = document.createElement("div");
        outLine.className = "out";
        outLine.textContent = step.out;
        terminalPanel.appendChild(outLine);
      }
    }

    await sleep(TIMING.terminalHold);
    if (myGen !== generation) return;
    terminalPanel.classList.remove("visible");
    codeBody.parentElement.style.opacity = "1";
  }

  async function startDesktopLoop(myGen) {
    while (myGen === generation) {
      await typeCodeLines(myGen);
      if (myGen !== generation) return;
      await sleep(TIMING.loopPause);
    }
  }

  // ---------- GitHub mockup (top-left panel) ----------
  // Fetches real commit/star/fork/contribution data from the Worker at
  // GITHUB_API_URL; falls back to STUB_GH_DATA if that fetch fails.
  let ghInitialized = false;
  async function fetchAndRenderGh() {
    if (ghInitialized) return;
    ghInitialized = true;

    let data;
    try {
      const res = await fetch(GITHUB_API_URL);
      if (!res.ok) throw new Error(`bad status ${res.status}`);
      data = await res.json();
    } catch (e) {
      data = STUB_GH_DATA;
    }

    renderGhCommits(data.commits || STUB_GH_DATA.commits);
    renderGhStats(data.stars, data.forks);
    renderGhGraph(data.contributions);
  }

  function renderGhCommits(commits) {
    const commitsEl = document.getElementById("gh-commits");
    if (!commitsEl) return;
    commitsEl.innerHTML = "";
    commits.slice(0, 3).forEach((c) => {
      const li = document.createElement("li");
      const hash = document.createElement("span");
      hash.className = "gh-hash";
      hash.textContent = c.sha;
      const age = document.createElement("em");
      age.textContent = c.relativeTime;
      li.appendChild(hash);
      li.appendChild(document.createTextNode(c.message + " "));
      li.appendChild(age);
      commitsEl.appendChild(li);
    });
  }

  function renderGhStats(stars, forks) {
    const starsEl = document.getElementById("gh-stars");
    const forksEl = document.getElementById("gh-forks");
    if (starsEl) starsEl.textContent = typeof stars === "number" ? stars : STUB_GH_DATA.stars;
    if (forksEl) forksEl.textContent = typeof forks === "number" ? forks : STUB_GH_DATA.forks;
  }

  // Custom hover tooltip for gh-graph cells — a single shared element
  // (rather than one per cell) positioned via clientX/Y, so it tracks the
  // cursor correctly even though #stage is scaled by the scroll-zoom.
  let ghTooltipEl = null;
  function ensureGhTooltip() {
    if (ghTooltipEl) return ghTooltipEl;
    ghTooltipEl = document.createElement("div");
    ghTooltipEl.className = "gh-tooltip";
    document.body.appendChild(ghTooltipEl);
    return ghTooltipEl;
  }
  function formatGhDate(dateStr) {
    return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }
  function showGhTooltip(e, day) {
    const el = ensureGhTooltip();
    el.textContent = `${day.count} contribution${day.count === 1 ? "" : "s"} on ${formatGhDate(day.date)}`;
    positionGhTooltip(e);
    el.classList.add("visible");
  }
  function positionGhTooltip(e) {
    if (!ghTooltipEl) return;
    ghTooltipEl.style.left = `${e.clientX}px`;
    ghTooltipEl.style.top = `${e.clientY}px`;
  }
  function hideGhTooltip() {
    if (ghTooltipEl) ghTooltipEl.classList.remove("visible");
  }

  // Lays the contribution days out as GitHub does: columns = weeks (Sunday
  // first), rows = day-of-week, with a month label placed above the first
  // week-column that starts a new month.
  function renderGhGraph(contributions) {
    const graphEl = document.getElementById("gh-graph");
    const monthsEl = document.getElementById("gh-months");
    if (!graphEl || !monthsEl) return;
    graphEl.innerHTML = "";
    monthsEl.innerHTML = "";

    if (!contributions || !contributions.length) {
      renderGhGraphFallback(graphEl, monthsEl);
      return;
    }

    // The API returns ~52 weeks, but the panel is only wide enough to show
    // cells legibly at the same density as the fallback grid (GRAPH_WEEKS
    // columns) — trim to the most recent weeks rather than cramming all 52
    // into a fixed-width pane.
    const trimmed = contributions.slice(-GRAPH_WEEKS * 7);
    const offset = new Date(trimmed[0].date + "T00:00:00").getDay();
    const padded = new Array(offset).fill(null).concat(trimmed);
    const weekCount = Math.ceil(padded.length / 7);

    graphEl.style.gridTemplateRows = "repeat(7, 1fr)";
    graphEl.style.gridTemplateColumns = `repeat(${weekCount}, 1fr)`;
    padded.forEach((day) => {
      const cell = document.createElement("div");
      cell.className = "gh-cell";
      if (day) {
        cell.dataset.level = day.level;
        cell.addEventListener("mouseenter", (e) => showGhTooltip(e, day));
        cell.addEventListener("mousemove", positionGhTooltip);
        cell.addEventListener("mouseleave", hideGhTooltip);
      } else {
        cell.classList.add("gh-cell-empty");
      }
      graphEl.appendChild(cell);
    });

    monthsEl.style.gridTemplateColumns = `repeat(${weekCount}, 1fr)`;
    let lastMonth = -1;
    for (let w = 0; w < weekCount; w++) {
      const weekDays = padded.slice(w * 7, w * 7 + 7).filter(Boolean);
      const label = document.createElement("span");
      if (weekDays.length) {
        const month = new Date(weekDays[0].date + "T00:00:00").getMonth();
        if (month !== lastMonth) {
          label.textContent = new Date(weekDays[0].date + "T00:00:00").toLocaleDateString("en-US", { month: "short" });
          lastMonth = month;
        }
      }
      monthsEl.appendChild(label);
    }
  }

  function renderGhGraphFallback(graphEl, monthsEl) {
    const WEEKS = GRAPH_WEEKS;
    graphEl.style.gridTemplateRows = "repeat(7, 1fr)";
    graphEl.style.gridTemplateColumns = `repeat(${WEEKS}, 1fr)`;
    monthsEl.style.gridTemplateColumns = `repeat(${WEEKS}, 1fr)`;
    for (let i = 0; i < WEEKS * 7; i++) {
      const cell = document.createElement("div");
      cell.className = "gh-cell";
      cell.dataset.level = Math.floor(Math.random() * 5);
      graphEl.appendChild(cell);
    }
    for (let w = 0; w < WEEKS; w++) {
      monthsEl.appendChild(document.createElement("span"));
    }
  }

  // ---------- Custom Spotify-style widget (top-right panel) ----------
  // Own player UI (not Spotify's iframe) over a static snapshot of the real
  // playlist's track/artist/art/preview-clip data — see TRACKS above.
  let spInitialized = false;
  function initSpotifyWidget() {
    if (spInitialized) return;
    spInitialized = true;

    const artImg = document.getElementById("sp-art-img");
    const titleEl = document.getElementById("sp-title");
    const artistEl = document.getElementById("sp-artist");
    const fillEl = document.getElementById("sp-progress-fill");
    const prevBtn = document.getElementById("sp-prev");
    const nextBtn = document.getElementById("sp-next");
    const playBtn = document.getElementById("sp-play");
    const playIcon = document.getElementById("sp-play-icon");
    const audio = new Audio();
    audio.preload = "auto";

    let index = 0;

    function setPlayIcon(playing) {
      playIcon.classList.toggle("is-playing", playing);
      playIcon.classList.toggle("is-paused", !playing);
      playBtn.setAttribute("aria-label", playing ? "Pause" : "Play");
    }

    function loadTrack(i, autoplay) {
      index = (i + TRACKS.length) % TRACKS.length;
      const track = TRACKS[index];
      artImg.src = track.art;
      titleEl.textContent = track.title;
      artistEl.textContent = track.artist;
      fillEl.style.width = "0%";
      audio.src = track.preview;
      if (autoplay) {
        // Browsers require play() to happen inside a user-gesture call
        // stack; this is fine on first load (called from the wheel/touch
        // handler that triggered boot) but may still be rejected in some
        // browsers — fail silently and leave the widget paused rather than
        // throwing.
        audio.play().catch(() => setPlayIcon(false));
      }
    }

    audio.addEventListener("timeupdate", () => {
      if (!audio.duration) return;
      fillEl.style.width = `${(audio.currentTime / audio.duration) * 100}%`;
    });
    audio.addEventListener("ended", () => loadTrack(index + 1, true));
    audio.addEventListener("play", () => setPlayIcon(true));
    audio.addEventListener("pause", () => setPlayIcon(false));

    prevBtn.addEventListener("click", () => loadTrack(index - 1, true));
    nextBtn.addEventListener("click", () => loadTrack(index + 1, true));
    playBtn.addEventListener("click", () => {
      if (audio.paused) {
        audio.play().catch(() => {});
      } else {
        audio.pause();
      }
    });

    loadTrack(0, true);
  }

  // ---------- Post-boot: scroll wheel zooms/pulls back the whole scene ----------
  window.addEventListener(
    "wheel",
    (e) => {
      if (!booted) return;
      const next = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, sceneZoom - e.deltaY * 0.0025));
      // Cancels Scene 2's push-in animation if it's still in flight — a
      // scroll mid-animation should immediately hand control to the user
      // instead of fighting it for the animation's remaining frames.
      zoomAnimToken++;
      applySceneZoom(next);
    },
    { passive: true }
  );

  // ---------- bfcache: replay the whole sequence on back-navigation ----------
  window.addEventListener("pageshow", (event) => {
    if (event.persisted) {
      resetToScene0();
      if (reducedMotion) goDirectlyToFinalState();
    }
  });

  if (reducedMotion) {
    goDirectlyToFinalState();
    return;
  }

  const fireOnce = (e) => {
    if (triggered) return;
    triggered = true;
    e.preventDefault();
    triggerBoot();
  };

  window.addEventListener("wheel", fireOnce, { passive: false });
  window.addEventListener(
    "touchmove",
    (e) => {
      e.preventDefault();
      fireOnce(e);
    },
    { passive: false }
  );
});
