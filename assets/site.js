// Builds the banner and sidebar on every page from one place.
// Pages load this with data-root set to the path back to the site root ("" or "../").
(() => {
  const ROOT = document.currentScript.dataset.root || "";
  const CURRENT = document.body.dataset.page || "";

  // ── Edit these lists to change the banner and sidebar on every page ──
  const BANNER_LINKS = [
    { label: "Home", href: "" },
    { label: "Branches", href: "branches/" },
    { label: "About", href: "#" },
    { label: "Discord", href: "https://discord.gg/tNb5w8UDU" }
  ];
  // Sanity readout: the banner status follows the visitor's sanity (100 = full).
  // Each stage shows while sanity is at or above its "min". Highest first.
  const SANITY_STAGES = [
    { min: 80, text: "Access approved and sanity stable." },
    { min: 60, text: "Access approved and sanity is average." },
    { min: 40, text: "Access approved and sanity is dropping." },
    { min: 20, text: "Access approved and sanity is low." },
    { min: 0,  text: "Access approved and sanity is critically low." }
  ];
  // At zero: the warning floods the screen, then the visitor is booted from the site.
  const CRITICAL = "!! CRITICAL STATUS. INGEST NORMAL PILLS IMMEDIATELY !!";
  const CRITICAL_FLOOD_MS = 2600; // how long the warning takes to cover the screen
  const CRITICAL_HOLD_MS = 1800;  // how long the final warning stays before the boot
  const BOOT_URL = "https://www.google.com";
  const SANITY_AFTER_BOOT = 20;   // what a booted visitor comes back with
  // The Voices: as sanity drops (stage 3 and below), text blurs and twitches, and at the
  // lowest stages faint pictures flash up. Add image paths (relative to the site root) here.
  const VOICE_IMAGES = [];
  const VOICE_IMAGE_OPACITY = 0.12;
  const SANITY_RECOVERY = 1; // points regained per second on safe pages (<body data-safe>)
  // Shown when someone clicks a link that has no page yet, on pages with data-lock-dead-links
  const LOCKED_MESSAGE = "DENIED";
  const NAV = [
    { items: [{ label: "Home", href: "", page: "home" }] },
    { heading: "Branches", items: [
      { label: "All branches", href: "branches/", page: "branches" },
      { label: "Hilltop Branch", href: "#" },
      { label: "Realmouth Branch", href: "#" },
      { label: "Dreamland Branch", href: "#" },
      { label: "Kipshyrian Branch", href: "#" },
      { label: "Zomgoosian Branch", href: "#" },
      { label: "Southern Branch", href: "southern/", page: "southern" }
    ]},
    { heading: "Records", items: [
      { label: "Retellings", href: "#" },
      { label: "Expedition logs", href: "expeditions/", page: "expeditions" }
    ]},
    { heading: "Reference", items: [
      { label: "Glossary", href: "#" },
      { label: "Timeline", href: "#" },
      { label: "About", href: "#" }
    ]}
  ];
  // What the search box can find. Add each new page here.
  const SEARCH = [
    { title: "SO-02-88", href: "southern/so-02-88.html", where: "Southern Branch", words: "sculk journal book poem forget-me-not" },
    { title: "SO-08-88", href: "southern/so-08-88.html", where: "Southern Branch", words: "plushie infinity eight" },
    { title: "SO-02-08", href: "southern/so-02-08.html", where: "Southern Branch", words: "town bablateville pillars purple nether pokemon" },
    { title: "Southern Branch", href: "southern/", where: "Branch", words: "vigil south" },
    { title: "Branches", href: "branches/", where: "Overview", words: "hilltop realmouth dreamland kipshyrian zomgoosian southern" },
    { title: "Expedition logs", href: "expeditions/", where: "Records", words: "expedition mimic zomgoosia golden hour hotel photos" },
    { title: "Expedition 1", href: "expeditions/expedition-1.html", where: "Expedition logs", words: "expedition first mimic photos" }
  ];

  const link = href => (/^(https?:|#)/.test(href) ? href : ROOT + href) || "./";
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

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
      </div>`;

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
  // drain it with PeoSanity.drain(points), or passively with <body data-sanity-drain="points per second">.
  const KEY = "peo-sanity";
  const clamp = v => Math.max(0, Math.min(100, v));
  let sanity = 100;
  try { const saved = parseFloat(localStorage.getItem(KEY)); if (!isNaN(saved)) sanity = clamp(saved); } catch (e) {}
  const status = document.getElementById("site-status");
  const render = () => {
    if (!status) return;
    const stage = SANITY_STAGES.find(s => sanity >= s.min) || SANITY_STAGES[SANITY_STAGES.length - 1];
    status.textContent = stage.text;
    status.classList.toggle("ph", stage.text.startsWith("["));
    const n = SANITY_STAGES.indexOf(stage) + 1;
    for (let i = 1; i <= SANITY_STAGES.length; i++) document.body.classList.toggle("sanity-" + i, i === n);
  };
  let booting = false;
  const set = v => {
    sanity = clamp(v);
    try { localStorage.setItem(KEY, String(sanity)); } catch (e) {}
    render();
    if (sanity === 0 && !booting && !document.body.hasAttribute("data-safe")) critical();
  };

  // Black terminal, copies of the warning popping up faster and faster until the screen
  // is covered, then a clean screen with the warning alone, then out.
  function critical() {
    booting = true;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const screen = document.createElement("div");
    screen.className = "critical";
    screen.setAttribute("role", "alert");
    document.body.append(screen);
    const line = text => Object.assign(document.createElement("span"), { textContent: text });
    const boot = () => {
      screen.textContent = "";
      const last = line(CRITICAL);
      last.className = "critical-final";
      screen.append(last);
      try { localStorage.setItem(KEY, String(SANITY_AFTER_BOOT)); } catch (e) {}
      setTimeout(() => location.replace(BOOT_URL), CRITICAL_HOLD_MS);
    };
    if (reduce) return boot();
    const probe = line(CRITICAL);
    screen.append(probe);
    const w = probe.offsetWidth, h = probe.offsetHeight;
    probe.remove();
    const total = Math.ceil((innerWidth / (w * 0.5) + 2) * (innerHeight / (h * 0.8) + 1) * 1.5);
    const start = performance.now();
    let shown = 0;
    (function frame() {
      const due = Math.min(total, Math.floor(total * ((performance.now() - start) / CRITICAL_FLOOD_MS) ** 2));
      for (; shown < due; shown++) {
        const s = line(CRITICAL);
        s.style.left = (Math.random() * (innerWidth + w) - w) + "px";
        s.style.top = (Math.random() * (innerHeight + h) - h) + "px";
        screen.append(s);
      }
      if (shown < total) setTimeout(frame, 30);
      else setTimeout(boot, 400);
    })();
  }
  window.PeoSanity = { get: () => sanity, drain: n => set(sanity - n), restore: n => set(sanity + n) };
  render();
  const perSecond = document.body.hasAttribute("data-safe") ? SANITY_RECOVERY
    : -(parseFloat(document.body.dataset.sanityDrain) || 0);
  if (perSecond) setInterval(() => { if (!document.hidden && clamp(sanity + perSecond) !== sanity) set(sanity + perSecond); }, 1000);
  // ── The Voices ──
  // Every so often, a random block of text glitches; lower sanity = more often, and faint pictures.
  if (!matchMedia("(prefers-reduced-motion: reduce)").matches) {
    const stageNow = () => SANITY_STAGES.indexOf(SANITY_STAGES.find(s => sanity >= s.min)) + 1;
    const voices = () => {
      const n = stageNow();
      if (n >= 3 && !document.hidden) {
        const blocks = document.querySelectorAll("main p, main li, main h1, main h2, main dd, .page-text");
        const pick = blocks[Math.floor(Math.random() * blocks.length)];
        if (pick) {
          pick.classList.add("voice-glitch");
          setTimeout(() => pick.classList.remove("voice-glitch"), 250 + Math.random() * 350);
        }
        if (n >= 4 && VOICE_IMAGES.length && Math.random() < (n === 5 ? 0.35 : 0.15)) {
          const img = document.createElement("img");
          img.className = "voice-image";
          img.alt = "";
          img.src = ROOT + VOICE_IMAGES[Math.floor(Math.random() * VOICE_IMAGES.length)];
          img.style.left = Math.random() * 70 + "vw";
          img.style.top = Math.random() * 70 + "vh";
          img.style.setProperty("--o", VOICE_IMAGE_OPACITY);
          document.body.append(img);
          setTimeout(() => img.remove(), 700 + Math.random() * 600);
        }
      }
      const gap = { 3: 6000, 4: 3000, 5: 1200 }[n] || 4000;
      setTimeout(voices, gap * (0.5 + Math.random()));
    };
    setTimeout(voices, 2000);
  }
})();
