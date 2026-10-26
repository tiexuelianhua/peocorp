// The Update Log, kept in one place. Home shows the newest few; updates/ shows them all.
// Add new entries at the TOP: { date: "YYYY-MM-DD", text: "..." }
// Add link: "path/" (from the site root) to make an entry open that page.
(() => {
  const UPDATES = [
    { date: "2026-10-26", text: "END OF PEO CORP page added", link: "events/end-of-peo-corp/" },
    { date: "2026-10-26", text: "Events page added", link: "events/" },
    { date: "2026-10-26", text: "Minor References/Referenced In changes" },
    { date: "2026-10-26", text: "Minor changes to layout/format" },
    { date: "2026-10-25", text: "Glossary and Timeline page placeholders added" },
    { date: "2026-10-25", text: "Reference/Referenced In list added for whenever one page refers to another page" },
    { date: "2026-10-24", text: "About page added" },
    { date: "2026-10-24", text: "Banner added" },
    { date: "2026-10-24", text: "Update log added" },
    { date: "2026-10-24", text: "Coloring changes" },
    { date: "2026-10-24", text: "Removed Background section and link from All branches page" },
    { date: "2026-10-24", text: "Branch cards on All branches page now darken as you get lower" },
    { date: "2026-10-24", text: "Added descriptions for Kipshyrian and Zomgoosian Branch" },
    { date: "2026-10-24", text: "Moved Peo Corp Background to the About Page" },
    { date: "2026-10-24", text: "Changed Start Here placeholder" }
  ];

  // Links are written from the site root; this file lives in assets/, so the root is one folder up
  const ROOT = new URL("../", document.currentScript.src);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  // Fills every <ul data-updates>; data-limit="N" shows only the newest N
  document.querySelectorAll("ul[data-updates]").forEach(ul => {
    const limit = parseInt(ul.dataset.limit, 10) || UPDATES.length;
    ul.innerHTML = UPDATES.slice(0, limit).map(u =>
      `<li><time datetime="${esc(u.date)}">${esc(u.date)}</time>${u.link
        ? `<a href="${esc(new URL(u.link, ROOT).href)}">${esc(u.text)}</a>`
        : `<span>${esc(u.text)}</span>`}</li>`).join("");
    // Hide the "full log" link while everything already fits
    const more = ul.parentElement.querySelector(".log-more");
    if (more && UPDATES.length <= limit) more.hidden = true;
  });
})();
