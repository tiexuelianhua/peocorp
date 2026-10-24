// The Update Log, kept in one place. Home shows the newest few; updates/ shows them all.
// Add new entries at the TOP: { date: "YYYY-MM-DD", text: "..." }
(() => {
  const UPDATES = [
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

  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  // Fills every <ul data-updates>; data-limit="N" shows only the newest N
  document.querySelectorAll("ul[data-updates]").forEach(ul => {
    const limit = parseInt(ul.dataset.limit, 10) || UPDATES.length;
    ul.innerHTML = UPDATES.slice(0, limit).map(u =>
      `<li><time datetime="${u.date}">${u.date}</time><span>${esc(u.text)}</span></li>`).join("");
    // Hide the "full log" link while everything already fits
    const more = ul.parentElement.querySelector(".log-more");
    if (more && UPDATES.length <= limit) more.hidden = true;
  });
})();
