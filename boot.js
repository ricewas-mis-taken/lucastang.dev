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
  top: { x: 0.3108, y: 0.3333, w: 0.2500, h: 0.1759 },
  bottom: { x: 0.2818, y: 0.5341, w: 0.3039, h: 0.1979 },
};

const MAX_DESK_BLUR = 10; // px, applied at full scroll-out (scale = ZOOM_MIN)

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

const GH_FILES = ["assets/", "index.html", "style.css", "boot.js", "README.md"];

const GH_COMMITS = [
  { hash: "a1b2c3d", msg: "Fix monitor alignment", age: "2h" },
  { hash: "9f8e7d6", msg: "Add boot sequence", age: "1d" },
  { hash: "5c4b3a2", msg: "Update styles", age: "3d" },
];

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
  const siteHeader = document.getElementById("site-header");
  const scrollHint = document.getElementById("scroll-hint");

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const ZOOM_MIN = 1;
  const ZOOM_MAX = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--zoom-scale")) || 2.6;

  // `generation` invalidates any in-flight async scene loops when the
  // sequence is reset (e.g. bfcache restore on back-navigation) without
  // needing every await to be manually cancelled.
  let generation = 0;
  let booted = false;
  let triggered = false;
  let sceneZoom = ZOOM_MAX;

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
    const place = (el, frac) => {
      el.style.left = `${renderX + frac.x * renderW}px`;
      el.style.top = `${renderY + frac.y * renderH}px`;
      el.style.width = `${frac.w * renderW}px`;
      el.style.height = `${frac.h * renderH}px`;
    };
    place(topOverlay, SCREENS.top);
    place(bottomOverlay, SCREENS.bottom);
  }

  if (deskPhoto.complete && deskPhoto.naturalWidth) {
    updateMonitorPositions();
  } else {
    deskPhoto.addEventListener("load", updateMonitorPositions, { once: true });
  }
  window.addEventListener("resize", updateMonitorPositions);

  // ---------- Scroll-driven whole-scene zoom + depth-of-field blur ----------
  function applySceneZoom(zoom) {
    sceneZoom = zoom;
    stage.style.transform = `scale(${zoom})`;
    const t = (zoom - ZOOM_MIN) / (ZOOM_MAX - ZOOM_MIN);
    deskPhoto.style.filter = `blur(${MAX_DESK_BLUR * (1 - t)}px)`;
  }

  function resetToScene0() {
    generation++;
    booted = false;
    triggered = false;
    sceneZoom = ZOOM_MAX;
    document.body.classList.remove("booted");
    stage.classList.remove("zoomed");
    stage.style.transition = "";
    stage.style.transform = "";
    deskPhoto.style.filter = "blur(0px)";
    topOverlay.classList.remove("flicker");
    bottomOverlay.classList.remove("flicker");
    bootSplashes.forEach((el) => el.classList.remove("visible"));
    screenContents.forEach((el) => el.classList.remove("visible"));
    siteHeader.classList.remove("visible");
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
    stage.classList.add("zoomed");
    stage.style.transition = "none";
    applySceneZoom(ZOOM_MAX);
    topOverlay.classList.remove("flicker");
    bottomOverlay.classList.remove("flicker");
    screenContents.forEach((el) => el.classList.add("visible"));
    siteHeader.classList.add("visible");
    renderGhMock();
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

    // Scene 2 — camera zoom (CSS-driven push-in to the tight monitor frame)
    stage.classList.add("zoomed");
    await sleep(TIMING.zoom);
    if (myGen !== generation) return;
    // Hand off from the CSS class transition to JS-driven inline transform
    // at the same end value, so post-boot scroll zoom can take over smoothly.
    stage.style.transition = "none";
    applySceneZoom(ZOOM_MAX);

    // Scene 5 — header reveals as soon as the zoom lands, independent of
    // the desktop loop below, which keeps running ambiently behind it.
    siteHeader.classList.add("visible");

    // Scene 3 — crossfade to rendered desktop
    screenContents.forEach((el) => el.classList.add("visible"));
    renderGhMock();
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

  // ---------- Fake GitHub mockup (top-left panel) ----------
  // Fully invented: no real repo data, no network calls, no outbound links.
  function renderGhMock() {
    const filesEl = document.getElementById("gh-files");
    const commitsEl = document.getElementById("gh-commits");
    const graphEl = document.getElementById("gh-graph");
    if (!filesEl || filesEl.childElementCount) return; // render once

    GH_FILES.forEach((name) => {
      const li = document.createElement("li");
      li.textContent = name;
      filesEl.appendChild(li);
    });

    GH_COMMITS.forEach((c) => {
      const li = document.createElement("li");
      const hash = document.createElement("span");
      hash.className = "gh-hash";
      hash.textContent = c.hash;
      const age = document.createElement("em");
      age.textContent = c.age;
      li.appendChild(hash);
      li.appendChild(document.createTextNode(c.msg + " "));
      li.appendChild(age);
      commitsEl.appendChild(li);
    });

    const WEEKS = 20;
    for (let i = 0; i < WEEKS * 7; i++) {
      const cell = document.createElement("div");
      cell.className = "gh-cell";
      cell.dataset.level = Math.floor(Math.random() * 5);
      graphEl.appendChild(cell);
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
    const audio = new Audio();
    audio.preload = "auto";

    let index = 0;

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
        audio.play().catch(() => {});
      }
    }

    audio.addEventListener("timeupdate", () => {
      if (!audio.duration) return;
      fillEl.style.width = `${(audio.currentTime / audio.duration) * 100}%`;
    });
    audio.addEventListener("ended", () => loadTrack(index + 1, true));

    prevBtn.addEventListener("click", () => loadTrack(index - 1, true));
    nextBtn.addEventListener("click", () => loadTrack(index + 1, true));

    loadTrack(0, true);
  }

  // ---------- Post-boot: scroll wheel zooms/pulls back the whole scene ----------
  window.addEventListener(
    "wheel",
    (e) => {
      if (!booted) return;
      const next = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, sceneZoom - e.deltaY * 0.0025));
      stage.style.transition = "none";
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
