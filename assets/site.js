// Builds the banner and sidebar on every page from one place.
// Pages load this with data-root set to the path back to the site root ("" or "../").
(() => {
  const ROOT = document.currentScript.dataset.root || "";
  const CURRENT = document.body.dataset.page || "";

  // ── Edit these lists to change the banner and sidebar on every page ──
  const BANNER_LINKS = [
    { label: "Home", href: "" },
    { label: "Branches", href: "branches/" },
    { label: "About", href: "about/" },
    { label: "Discord", href: "https://discord.gg/tNb5w8UDU" }
  ];
  // Scrolling message strip along the bottom of the banner. It takes each section's accent color
  // (from that section's theme css). The messages themselves live in banner-messages.txt at the
  // site root (one per line), so they can be edited on GitHub without touching this file.
  const TICKER_FILE = "banner-messages.txt";
  const TICKER_SPEED = 45; // pixels per second
  // Sanity readout: the banner status follows the visitor's sanity (100 = full).
  // Each stage shows while sanity is at or above its "min". Highest first.
  // The readout is "<text> Sanity: N%" with the live number (rounded up, so 0% only at exactly 0).
  // The "zero" stage shows only at exactly 0. "blink" makes the readout blink constantly.
  const SANITY_STAGES = [
    { min: 80, text: "Access approved." },
    { min: 60, text: "Access approved." },
    { min: 40, text: "Access approved." },
    { min: 20, text: "Access approved." },
    { min: 0,  text: "Access approved.", blink: true },
    { min: 0,  text: "???????.", blink: true, zero: true }
  ];
  // The Voices' lines: typed out in red at random spots, then fading away.
  // A few start at "low" sanity; at zero many come at once before the warning.
  const VOICE_LINES = [
    "IT'S REAL, I'VE SEEN IT. IT'S REAL, I'VE SEEN IT. IT'S REAL, I'VE SEEN IT.",
    "THEY SAID IT. WE SAID IT. YOU WILL BELIEVE THE TRUTH",
    "THE WAY TO THE SOUTH",
    "THE SEARCH WILL COMMENCE.",
    "IT'S A LIE, I KNOW IT. IT'S A LIE, I KNOW IT. IT'S A LIE, I KNOW IT."
  ];
  const VOICE_TYPE_MS = 45;      // per typed character
  const VOICE_HOLD_MS = 2500;    // how long a finished line stays before fading
  const VOICE_LINE_FADE_MS = 1500;
  // At "low" (stage 4) and "critically low" (stage 5): most lines at once, and the wait between them
  const VOICE_LINE_STAGES = { 4: { max: 1, gap: [15000, 30000] }, 5: { max: 2, gap: [6000, 14000] }, 6: { max: 2, gap: [6000, 14000] } };
  // At zero: the screen goes black, this many lines appear, then the warning (in green), then the boot.
  const CRITICAL = "!! CRITICAL STATUS. INGEST NORMAL PILLS IMMEDIATELY. !!";
  const CRITICAL_OPENING_LINES = 12;   // Voices lines typed over the page first
  const CRITICAL_OPENING_GAP_MS = 300;
  const CRITICAL_FADE_MS = 3500;      // the page distorts and blurs while going black, this long
  const CRITICAL_HOLD_MS = 1800;      // how long the warning stays before the boot
  const BOOT_URL = "https://www.google.com";
  const SANITY_AFTER_BOOT = 20;   // what a booted visitor comes back with
  // The Voices: as sanity drops (stage 3 and below), text blurs and twitches, and at the
  // lowest stages faint pictures flash up. Add image paths (relative to the site root) here.
  const VOICE_IMAGES = ["assets/voices/voices-1.jpg", "assets/voices/voices-2.jpg", "assets/voices/voices-3.jpg", "assets/voices/voices-4.jpg"];
  const VOICE_IMAGE_OPACITY = 0.18;
  // They creep in slowly and linger, so it feels like they've been there a while before you notice.
  const VOICE_FADE_MS = 6000;               // fade in (and out) time
  const VOICE_LINGER_MS = [15000, 30000];   // how long one stays, between these
  const VOICE_MAX = 2;                      // most on screen at once
  const SANITY_RECOVERY = 1; // points regained per second on safe pages (<body data-safe>)
  // Shown when someone clicks a link that has no page yet, on pages with data-lock-dead-links
  const LOCKED_MESSAGE = "DENIED";
  const NAV = [
    { items: [{ label: "Home", href: "", page: "home" }] },
    { heading: "Branches", items: [
      { label: "All branches", href: "branches/", page: "branches" },
      { label: "Hilltop Branch", href: "hilltop/", page: "hilltop" },
      { label: "Realmouth Branch", href: "realmouth/", page: "realmouth" },
      { label: "Dreamland Branch", href: "dreamland/", page: "dreamland" },
      { label: "Kipshyrian Branch", href: "kipshyrian/", page: "kipshyrian" },
      { label: "Zomgoosian Branch", href: "zomgoosian/", page: "zomgoosian" },
      { label: "Southern Branch", href: "southern/", page: "southern" }
    ]},
    { heading: "Records", items: [
      { label: "Retellings", href: "#" },
      { label: "Expedition logs", href: "expeditions/", page: "expeditions" },
      { label: "Events", href: "events/", page: "events" }
    ]},
    { heading: "Reference", items: [
      { label: "Glossary", href: "glossary/", page: "glossary" },
      { label: "Timeline", href: "timeline/", page: "timeline" },
      { label: "About", href: "about/", page: "about" },
      { label: "Update Log", href: "updates/", page: "updates" }
    ]}
  ];
  // What the search box can find. Add each new page here.
  const SEARCH = [
    { title: "SO-02-88", href: "southern/so-02-88.html", where: "Southern Branch", words: "sculk journal book poem forget-me-not" },
    { title: "SO-08-88", href: "southern/so-08-88.html", where: "Southern Branch", words: "plushie infinity eight" },
    { title: "SO-02-08", href: "southern/so-02-08.html", where: "Southern Branch", words: "town bablateville pillars purple nether pokemon" },
    { title: "Hilltop Branch", href: "hilltop/", where: "Branch", words: "north peoville captain station hilltop meetings refuge" },
    { title: "Realmouth Branch", href: "realmouth/", where: "Branch", words: "rituals round table research code-sustain code-preserve candles" },
    { title: "Dreamland Branch", href: "dreamland/", where: "Branch", words: "pharmaceuticals masks normal pill scouting south dream" },
    { title: "Kipshyrian Branch", href: "kipshyrian/", where: "Branch", words: "manufacturing building cube runes tools weapons machinery archipelago" },
    { title: "Zomgoosian Branch", href: "zomgoosian/", where: "Branch", words: "expeditions south camp camera zomgoose trail" },
    { title: "Southern Branch", href: "southern/", where: "Branch", words: "vigil south" },
    { title: "Branches", href: "branches/", where: "Overview", words: "hilltop realmouth dreamland kipshyrian zomgoosian southern" },
    { title: "Glossary", href: "glossary/", where: "Reference", words: "glossary terms definitions" },
    { title: "Timeline", href: "timeline/", where: "Reference", words: "timeline history events dates" },
    { title: "Update Log", href: "updates/", where: "Reference", words: "updates changes news log" },
    { title: "About Peo Corp", href: "about/", where: "Reference", words: "about manager background captain essences mission our mission expedition north peoville addendum" },
    { title: "Expedition logs", href: "expeditions/", where: "Records", words: "expedition mimic zomgoosia golden hour hotel photos" },
    { title: "Expedition 1", href: "expeditions/expedition-1.html", where: "Expedition logs", words: "expedition first mimic photos" },
    { title: "Events", href: "events/", where: "Records", words: "events event incidents history" },
    { title: "END OF PEO CORP", href: "events/end-of-peo-corp/", where: "Events", words: "end of peo corp event journal hilltop pizzeria garden hyacinth constant reminder" }
  ];

  const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  // Link addresses are escaped too, so nothing in one can break out of href="..."
  const link = href => esc((/^(https?:|#)/.test(href) ? href : ROOT + href) || "./");

  // ── Banner ──
  const banner = document.getElementById("site-banner");
  if (banner) {
    banner.innerHTML = `
      <div class="banner-inner">
        <a href="${link("")}"><img class="logo" src="${ROOT}assets/peo.webp" alt="Peo Corp home" width="64" height="64"></a>
        <div class="brand">
          <p class="site-name">PEO CORP</p>
          <p class="tagline">Expediting towards infinity.</p>
        </div>
        <div class="banner-tools">
          <nav class="top-links" aria-label="Quick links">
            ${BANNER_LINKS.map(l => `<a href="${link(l.href)}"${/^https?:/.test(l.href) ? ' target="_blank" rel="noopener"' : ""}>${esc(l.label)}</a>`).join("")}
          </nav>
          <p class="status" id="site-status" aria-live="polite"></p>
          <div class="search">
            <label class="search-box"><span aria-hidden="true">&gt;</span>
              <input type="search" id="site-search" placeholder="search" autocomplete="off" aria-label="Search the archive" aria-controls="site-search-results">
            </label>
            <ul id="site-search-results" class="search-results" hidden></ul>
          </div>
        </div>
      </div>
      <div class="ticker" role="marquee" aria-label="Messages" hidden><div class="ticker-track"></div></div>`;

    // Load the messages; the strip stays hidden if the file is empty or can't be read
    const ticker = banner.querySelector(".ticker");
    fetch(ROOT + TICKER_FILE, { cache: "no-cache" })
      .then(r => (r.ok ? r.text() : ""))
      .catch(() => "")
      .then(text => {
        // One message per line; blank lines and lines starting with # are skipped
        const msgs = text.split(/\r?\n/).map(l => l.trim()).filter(l => l && !l.startsWith("#"));
        if (!msgs.length) return;
        const track = ticker.firstElementChild;
        const runHtml = () => msgs.map(t => `<span class="ticker-msg">${esc(t)}</span>`).join("");
        track.innerHTML = `<span class="ticker-run">${runHtml()}</span><span class="ticker-run" aria-hidden="true"></span>`;
        ticker.hidden = false;
        const run = track.firstElementChild;
        // Repeat the messages until one run is wider than the screen, so the strip never shows a gap
        while (run.offsetWidth && run.offsetWidth < window.innerWidth && run.children.length < 200) run.insertAdjacentHTML("beforeend", runHtml());
        track.lastElementChild.innerHTML = run.innerHTML;
        // Scroll speed stays the same however long the messages are
        track.style.setProperty("--ticker-s", Math.max(8, run.offsetWidth / TICKER_SPEED) + "s");
      });

    const input = banner.querySelector("#site-search");
    const list = banner.querySelector("#site-search-results");
    let active = 0; // which result Enter opens; arrow keys move it
    const mark = () => list.querySelectorAll("a").forEach((a, i) => a.classList.toggle("active", i === active));
    const show = () => {
      active = 0;
      const q = input.value.trim().toLowerCase();
      if (!q) { list.hidden = true; list.innerHTML = ""; return; }
      const hits = SEARCH.filter(s => (s.title + " " + s.where + " " + s.words).toLowerCase().includes(q));
      list.innerHTML = hits.length
        ? hits.map(s => `<li><a href="${link(s.href)}"><span class="code">${esc(s.title)}</span> <span class="where">${esc(s.where)}</span></a></li>`).join("")
        : `<li class="none">No matching files.</li>`;
      list.hidden = false;
      mark();
    };
    input.addEventListener("input", show);
    input.addEventListener("focus", show);
    input.addEventListener("keydown", e => {
      const links = list.querySelectorAll("a");
      if ((e.key === "ArrowDown" || e.key === "ArrowUp") && links.length && !list.hidden) {
        e.preventDefault();
        active = (active + (e.key === "ArrowDown" ? 1 : -1) + links.length) % links.length;
        mark();
        links[active].scrollIntoView({ block: "nearest" });
      }
      if (e.key === "Enter" && links[active]) location.href = links[active].href;
      if (e.key === "Escape") { input.value = ""; show(); }
    });
    document.addEventListener("click", e => { if (!banner.querySelector(".search").contains(e.target)) list.hidden = true; });
  }

  // ── Sidebar ──
  const nav = document.getElementById("site-nav");
  if (nav) {
    nav.innerHTML = NAV.map(group => `
      ${group.heading ? `<h2>${esc(group.heading)}</h2>` : ""}
      <ul>${group.items.map(i => `<li><a href="${link(i.href)}"${i.page && i.page === CURRENT ? ' aria-current="page"' : ""}>${esc(i.label)}</a></li>`).join("")}</ul>`).join("");
  }
  // ── Links with no page yet ──
  // Only on pages that opt in (<body data-lock-dead-links>). Real links are untouched.
  if (document.body.hasAttribute("data-lock-dead-links")) {
    const toast = document.createElement("p");
    toast.className = "locked-toast" + (LOCKED_MESSAGE.startsWith("[") ? " ph" : "");
    toast.setAttribute("role", "status");
    toast.hidden = true;
    toast.textContent = LOCKED_MESSAGE;
    document.body.append(toast);
    let timer;
    document.querySelectorAll('a[href="#"]').forEach(a => {
      a.classList.add("locked");
      a.setAttribute("aria-disabled", "true");
      a.addEventListener("click", e => {
        e.preventDefault();
        toast.hidden = false;
        clearTimeout(timer);
        timer = setTimeout(() => { toast.hidden = true; }, 2500);
      });
    });
  }
  // ── Sanity ──
  // Kept in this visitor's browser only. Safe pages slowly restore it; hensa pages can
  // drain it with __ps.drain(points), or passively with <body data-sanity-drain="points per second">.
  const KEY = "peo-sanity";
  const clamp = v => Math.max(0, Math.min(100, v));
  let sanity = 100;
  try { const saved = parseFloat(localStorage.getItem(KEY)); if (!isNaN(saved)) sanity = clamp(saved); } catch (e) {}
  const status = document.getElementById("site-status");
  let lastStage = 0;
  // Stage number (1 = highest) for the current sanity
  const stageNow = () => {
    const shown = Math.ceil(sanity); // go by the number on the readout
    const stage = shown === 0 ? SANITY_STAGES.find(s => s.zero) : SANITY_STAGES.find(s => !s.zero && shown >= s.min);
    return SANITY_STAGES.indexOf(stage || SANITY_STAGES[SANITY_STAGES.length - 1]) + 1;
  };
  const render = () => {
    if (!status) return;
    const n = stageNow(), stage = SANITY_STAGES[n - 1];
    status.textContent = `${stage.text} Sanity: ${Math.ceil(sanity)}%`;
    status.classList.toggle("ph", stage.text.startsWith("["));
    status.classList.toggle("status-blink", !!stage.blink);
    // The readout flickers whenever it moves to a new stage
    if (lastStage && n !== lastStage) {
      status.classList.remove("status-flicker");
      void status.offsetWidth;
      status.classList.add("status-flicker");
      // Drop it afterwards so the blink (if any) takes over again
      clearTimeout(render.flickerTimer);
      render.flickerTimer = setTimeout(() => status.classList.remove("status-flicker"), 750);
    }
    lastStage = n;
    // The Home page stays calm: no sanity effects there, only the readout changes
    for (let i = 1; i <= SANITY_STAGES.length; i++) document.body.classList.toggle("sanity-" + i, i === n && CURRENT !== "home");
  };
  let booting = false;
  const set = v => {
    sanity = clamp(v);
    try { localStorage.setItem(KEY, String(sanity)); } catch (e) {}
    render();
    if (sanity === 0 && !booting && !document.body.hasAttribute("data-safe")) critical();
  };

  const sleep = ms => new Promise(r => setTimeout(r, ms));

  // Types one of the Voices' lines at a random free spot in `layer`, holds it, then fades it out.
  async function speak(layer, text, hold = VOICE_HOLD_MS) {
    const el = document.createElement("span");
    el.className = "voice-line";
    el.textContent = text;
    el.style.visibility = "hidden";
    layer.append(el);
    const w = Math.ceil(el.getBoundingClientRect().width) + 1, h = el.offsetHeight;
    el.style.width = w + "px"; // keep the measured wrapping once it's moved into place
    // Each line reserves its full finished size, even while it's still being typed
    const taken = [...layer.querySelectorAll(".voice-line")].filter(o => o !== el && o.box).map(o => o.box);
    // No free spot: skip this line rather than cover another one, so everything stays readable
    let x, y, free = false;
    for (let tries = 0; tries < 40 && !free; tries++) {
      x = 16 + Math.random() * Math.max(0, innerWidth - w - 32);
      y = 16 + Math.random() * Math.max(0, innerHeight - h - 32);
      free = !taken.some(r => x < r.right + 12 && x + w > r.left - 12 && y < r.bottom + 8 && y + h > r.top - 8);
    }
    if (!free) { el.remove(); return; }
    el.style.left = x + "px";
    el.style.top = y + "px";
    el.box = { left: x, top: y, right: x + w, bottom: y + h };
    el.textContent = "";
    el.style.visibility = "";
    for (const ch of text) { el.textContent += ch; await sleep(VOICE_TYPE_MS); }
    await sleep(hold);
    el.classList.add("fading");
    await sleep(VOICE_LINE_FADE_MS);
    el.remove();
  }
  const randomLine = () => VOICE_LINES[Math.floor(Math.random() * VOICE_LINES.length)];

  // At zero: a handful of the Voices' lines over the page, then the page distorts and blurs
  // while fading to black, then only the warning on the black screen, then out.
  async function critical() {
    booting = true;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const screen = document.createElement("div");
    screen.className = "critical";
    screen.setAttribute("role", "alert");
    document.body.append(screen);
    if (!reduce) {
      // Share the page's own Voices layer so these lines and any already showing never overlap
      let opening = document.querySelector("body > .voice-lines");
      if (!opening) {
        opening = document.createElement("div");
        opening.className = "voice-lines";
        opening.setAttribute("aria-hidden", "true");
        document.body.append(opening);
      }
      for (let i = 0; i < CRITICAL_OPENING_LINES; i++) {
        speak(opening, randomLine(), 6000);
        await sleep(CRITICAL_OPENING_GAP_MS);
      }
      await sleep(1500);
      document.body.classList.add("meltdown");
      screen.style.transition = `opacity ${CRITICAL_FADE_MS}ms ease-in`;
      await sleep(30);
      screen.style.opacity = "1";
      await sleep(CRITICAL_FADE_MS);
    } else {
      screen.style.opacity = "1";
    }
    const last = document.createElement("p");
    last.className = "critical-final";
    screen.append(last);
    if (reduce) last.textContent = CRITICAL;
    else for (const ch of CRITICAL) { last.textContent += ch; await sleep(VOICE_TYPE_MS); }
    try { localStorage.setItem(KEY, String(SANITY_AFTER_BOOT)); } catch (e) {}
    await sleep(CRITICAL_HOLD_MS);
    location.replace(BOOT_URL);
  }
  window.__ps = { get: () => sanity, drain: n => set(sanity - n), restore: n => set(sanity + n) };
  render();
  let testDrain = 0;
  try {
    const q = new URLSearchParams(location.search).get("q9");
    if (q !== null) sessionStorage.setItem("peo-q9", q);
    testDrain = parseFloat(sessionStorage.getItem("peo-q9")) || 0;
  } catch (e) {}
  // <body data-safe="N"> recovers N points a second instead of the usual rate
  const perSecond = document.body.hasAttribute("data-safe") ? (parseFloat(document.body.dataset.safe) || SANITY_RECOVERY)
    : -((parseFloat(document.body.dataset.sanityDrain) || 0) + testDrain);
  if (perSecond) setInterval(() => { if (!document.hidden && clamp(sanity + perSecond) !== sanity) set(sanity + perSecond); }, 1000);
  // ── The Voices ──
  // Every so often, a random block of text glitches; lower sanity = more often, and faint pictures.
  if (CURRENT !== "home" && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
    const voices = () => {
      const n = stageNow();
      if (n >= 3 && !document.hidden) {
        const blocks = document.querySelectorAll("main p, main li, main h1, main h2, main dd, .page-text");
        // At "critically low", two blocks glitch at once, for longer
        for (let i = 0; i < (n >= 5 ? 2 : 1); i++) {
          const pick = blocks[Math.floor(Math.random() * blocks.length)];
          if (!pick) continue;
          pick.classList.add("voice-glitch");
          setTimeout(() => pick.classList.remove("voice-glitch"), (n >= 5 ? 400 : 250) + Math.random() * 350);
        }
        // At 5% and below, now and then the banner or menu twitches too (never the Home links)
        if (n >= 5 && Math.random() < 0.25) {
          const frame = [...document.querySelectorAll(".site-name, .tagline, .top-links a, nav.side h2, nav.side a")]
            .filter(el => el.textContent.trim() !== "Home");
          const pick = frame[Math.floor(Math.random() * frame.length)];
          if (pick) {
            pick.classList.add("frame-glitch");
            setTimeout(() => pick.classList.remove("frame-glitch"), 150 + Math.random() * 200);
          }
        }
        const main = document.querySelector("main");
        if (n >= 5 && main && Math.random() < 0.12) {
          main.classList.add("voice-shudder");
          setTimeout(() => main.classList.remove("voice-shudder"), 200 + Math.random() * 250);
        }
        if (n >= 4 && VOICE_IMAGES.length && document.querySelectorAll(".voice-image").length < VOICE_MAX
            && Math.random() < (n >= 5 ? 0.2 : 0.08)) {
          const img = document.createElement("img");
          img.className = "voice-image";
          img.alt = "";
          img.src = ROOT + VOICE_IMAGES[Math.floor(Math.random() * VOICE_IMAGES.length)];
          // Random spot, kept away from any picture already showing
          const others = [...document.querySelectorAll(".voice-image")].map(o => [parseFloat(o.style.left), parseFloat(o.style.top)]);
          let x, y, tries = 0;
          do { x = Math.random() * 70; y = Math.random() * 70; }
          while (++tries < 20 && others.some(([ox, oy]) => Math.abs(ox - x) < 30 && Math.abs(oy - y) < 30));
          img.style.left = x + "vw";
          img.style.top = y + "vh";
          img.style.transition = `opacity ${VOICE_FADE_MS}ms ease-in-out`;
          document.body.append(img);
          setTimeout(() => { img.style.opacity = VOICE_IMAGE_OPACITY; }, 50);
          const linger = VOICE_LINGER_MS[0] + Math.random() * (VOICE_LINGER_MS[1] - VOICE_LINGER_MS[0]);
          setTimeout(() => { img.style.opacity = 0; setTimeout(() => img.remove(), VOICE_FADE_MS); }, VOICE_FADE_MS + linger);
        }
      }
      const gap = { 3: 6000, 4: 3000, 5: 1200, 6: 1200 }[n] || 4000;
      setTimeout(voices, gap * (0.5 + Math.random()));
    };
    setTimeout(voices, 2000);

    // The Voices' lines, typed over the page at "low" and "critically low"
    const layer = document.createElement("div");
    layer.className = "voice-lines";
    layer.setAttribute("aria-hidden", "true");
    document.body.append(layer);
    const lineLoop = () => {
      const cfg = VOICE_LINE_STAGES[stageNow()];
      if (cfg && !document.hidden && !booting && layer.children.length < cfg.max) speak(layer, randomLine());
      const gap = cfg ? cfg.gap[0] + Math.random() * (cfg.gap[1] - cfg.gap[0]) : 5000;
      setTimeout(lineLoop, gap);
    };
    setTimeout(lineLoop, 4000);
  }

  // Opening the clearance file checks credentials for a moment first
  document.querySelectorAll("details.clearance").forEach(d => {
    const status = d.querySelector(".clr-status");
    d.querySelector("summary").addEventListener("click", e => {
      if (d.open || d.classList.contains("approved")) return;
      e.preventDefault();
      if (d.classList.contains("verifying")) return;
      d.classList.add("verifying");
      status.textContent = "Verifying. . .";
      setTimeout(() => {
        d.classList.remove("verifying");
        d.classList.add("approved");
        status.textContent = "Access Approved";
        d.open = true;
      }, 900);
    });
  });
})();
