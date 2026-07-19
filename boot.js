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
  headerDelayAfterFirstTerminal: 400,
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
  { html: '    <span class="kw">await</span> <span class="fn">sleep</span>(18);' },
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

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

document.addEventListener("DOMContentLoaded", () => {
  const stage = document.getElementById("stage");
  const topOverlay = document.getElementById("top-monitor");
  const bottomOverlay = document.getElementById("bottom-monitor");
  const bootSplashes = document.querySelectorAll(".boot-splash");
  const screenContents = document.querySelectorAll(".screen-content");
  const codeGutter = document.querySelector("#code-editor .gutter");
  const codeBody = document.querySelector("#code-editor .code-body");
  const terminalPanel = document.getElementById("terminal-panel");
  const siteHeader = document.getElementById("site-header");
  const skipBtn = document.getElementById("skip-intro");
  const scrollHint = document.getElementById("scroll-hint");

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let booted = false;
  let skipped = false;
  let loopHandle = null;

  function goDirectlyToFinalState() {
    document.body.classList.add("booted");
    stage.classList.add("zoomed");
    stage.style.transition = "none";
    topOverlay.classList.remove("flicker");
    bottomOverlay.classList.remove("flicker");
    screenContents.forEach((el) => el.classList.add("visible"));
    siteHeader.classList.add("visible");
    skipBtn.classList.remove("visible");
    scrollHint.style.display = "none";
    startDesktopLoop();
  }

  function triggerBoot() {
    if (booted) return;
    booted = true;
    document.body.classList.add("booted");
    skipBtn.classList.add("visible");
    runSequence();
  }

  async function runSequence() {
    // Scene 1 — boot flicker + splash
    topOverlay.classList.add("flicker");
    bottomOverlay.classList.add("flicker");
    await sleep(TIMING.flicker);
    if (skipped) return;

    bootSplashes.forEach((el) => el.classList.add("visible"));
    await sleep(TIMING.bootSplash);
    if (skipped) return;
    bootSplashes.forEach((el) => el.classList.remove("visible"));

    // Scene 2 — camera zoom
    stage.classList.add("zoomed");
    await sleep(TIMING.zoom);
    if (skipped) return;

    // Scene 3 — crossfade to rendered desktop
    screenContents.forEach((el) => el.classList.add("visible"));
    await sleep(TIMING.crossfade);
    if (skipped) return;

    startDesktopLoop();
  }

  function skipIntro() {
    skipped = true;
    if (loopHandle) clearTimeout(loopHandle);
    goDirectlyToFinalState();
  }

  async function typeCodeLines() {
    codeGutter.textContent = "";
    codeBody.innerHTML = "";
    for (let i = 0; i < CODE_LINES.length; i++) {
      if (skipped) return;
      const lineEl = document.createElement("div");
      codeBody.appendChild(lineEl);
      const gutterLine = document.createElement("div");
      gutterLine.textContent = i + 1;
      codeGutter.appendChild(gutterLine);

      await typeHtmlLine(lineEl, CODE_LINES[i].html);
      await sleep(TIMING.lineDelay);
      if (skipped) return;

      if ((i + 1) % TIMING.terminalEvery === 0) {
        await runTerminalInterlude();
        if (skipped) return;
      }
    }
  }

  // Types an HTML-bearing line char-by-char without breaking tags: reveals
  // the target markup progressively by growing a slice of the source string.
  async function typeHtmlLine(el, html) {
    const plain = html.replace(/<[^>]+>/g, "");
    let shown = 0;
    for (let i = 0; i < plain.length; i++) {
      shown++;
      el.innerHTML = revealHtml(html, shown);
      await sleep(TIMING.typeSpeed);
      if (skipped) return;
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

  async function runTerminalInterlude() {
    codeBody.parentElement.style.opacity = "0";
    terminalPanel.innerHTML = "";
    terminalPanel.classList.add("visible");
    await sleep(200);

    for (const step of TERMINAL_COMMANDS) {
      if (skipped) return;
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
        if (skipped) return;
      }
      await sleep(TIMING.terminalLineDelay);

      if (step.out) {
        const outLine = document.createElement("div");
        outLine.textContent = step.out;
        outLine.style.opacity = "0.75";
        terminalPanel.appendChild(outLine);
      }
    }

    await sleep(TIMING.terminalHold);
    if (skipped) return;
    terminalPanel.classList.remove("visible");
    codeBody.parentElement.style.opacity = "1";

    if (!siteHeader.classList.contains("visible")) {
      await sleep(TIMING.headerDelayAfterFirstTerminal);
      if (!skipped) siteHeader.classList.add("visible");
    }
  }

  async function startDesktopLoop() {
    // eslint-disable-next-line no-constant-condition
    while (!skipped) {
      await typeCodeLines();
      if (skipped) return;
      await sleep(1200);
    }
  }

  skipBtn.addEventListener("click", skipIntro);

  if (reducedMotion) {
    goDirectlyToFinalState();
    return;
  }

  let triggered = false;
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
