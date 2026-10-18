// Some embedded viewers carry the previous page's scroll position over, which
// drops you at the bottom of a shorter page. Plain link navigations without a
// #section start at the top; back/forward keeps its position.
export function resetScrollOnFreshLoad() {
  const entry = performance.getEntriesByType?.("navigation")[0];
  if (location.hash || (entry && entry.type !== "navigate")) return;
  const toTop = () => window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  toTop();
  document.addEventListener("DOMContentLoaded", toTop, { once: true });
  window.addEventListener("load", () => requestAnimationFrame(toTop), { once: true });
}
