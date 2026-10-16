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
  const STATUS = "[Status readout: Placeholder]";
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
          <p class="status ${STATUS.startsWith("[") ? "ph" : ""}">${esc(STATUS)}</p>
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
})();
