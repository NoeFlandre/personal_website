// Turns a list of in-page links into tabs: one linked panel is shown at a time.
// Any link on the page to a panel (the list itself, "next" links) opens it,
// arrow keys move between tabs, and the URL hash follows so a tab can be shared.
export function initTabs(list) {
  const tabs = [...list.querySelectorAll('a[href^="#"]')];
  const panels = tabs.map((a) => document.getElementById(a.hash.slice(1)));
  if (!tabs.length || !panels.every(Boolean)) return;
  const ids = panels.map((p) => p.id);

  list.setAttribute("role", "tablist");
  tabs.forEach((a, i) => {
    a.parentElement.setAttribute("role", "presentation");
    a.setAttribute("role", "tab");
    a.id ||= `tab-${ids[i]}`;
    a.setAttribute("aria-controls", ids[i]);
    panels[i].setAttribute("role", "tabpanel");
    panels[i].setAttribute("aria-labelledby", a.id);
  });
  panels[0].parentElement.classList.add("is-tabbed");

  const select = (i, focus = false) => {
    tabs.forEach((a, j) => {
      const on = i === j;
      a.classList.toggle("is-current", on);
      a.setAttribute("aria-selected", String(on));
      a.tabIndex = on ? 0 : -1;
      panels[j].hidden = !on;
    });
    if (focus) tabs[i].focus();
  };

  document.addEventListener("click", (e) => {
    const a = e.target.closest?.('a[href^="#"]');
    const i = a ? ids.indexOf(a.hash.slice(1)) : -1;
    if (i < 0) return;
    e.preventDefault();
    select(i);
    history.replaceState(null, "", `#${ids[i]}`);
    // Coming from the bottom of a long panel: bring the new one into view.
    const top = list.getBoundingClientRect().top;
    if (top < 0) window.scrollBy({ top: top - 120, behavior: "smooth" });
  });

  list.addEventListener("keydown", (e) => {
    const i = tabs.indexOf(document.activeElement);
    const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
    const to = e.key === "Home" ? 0 : e.key === "End" ? tabs.length - 1 : step ? (i + step + tabs.length) % tabs.length : -1;
    if (i < 0 || to < 0) return;
    e.preventDefault();
    select(to, true);
  });

  const fromHash = ids.indexOf(location.hash.slice(1));
  select(fromHash >= 0 ? fromHash : 0);
}
