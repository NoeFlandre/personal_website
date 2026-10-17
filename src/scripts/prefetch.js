// Browsers without speculation rules: fetch a same-site page as soon as its
// link is hovered, touched or focused, so opening it feels instant.
export function initPrefetch() {
  if (HTMLScriptElement.supports?.("speculationrules")) return;
  const fetched = new Set([location.pathname]);
  const prefetch = (e) => {
    const a = e.target.closest?.("a[href]");
    if (!a) return;
    const url = new URL(a.href, location.href);
    if (url.origin !== location.origin || fetched.has(url.pathname)) return;
    fetched.add(url.pathname);
    const link = document.createElement("link");
    link.rel = "prefetch";
    link.href = url.pathname;
    document.head.append(link);
  };
  document.addEventListener("pointerover", prefetch, { passive: true });
  document.addEventListener("touchstart", prefetch, { passive: true });
  document.addEventListener("focusin", prefetch);
}
