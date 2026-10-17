(() => {
"use strict";

// scroll-reset.js
// Some embedded viewers carry the previous page's scroll position over, which
// drops you at the bottom of a shorter page. Plain link navigations without a
// #section start at the top; back/forward keeps its position.
function resetScrollOnFreshLoad() {
  const entry = performance.getEntriesByType?.("navigation")[0];
  if (location.hash || (entry && entry.type !== "navigate")) return;
  const toTop = () => window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  toTop();
  document.addEventListener("DOMContentLoaded", toTop, { once: true });
  window.addEventListener("load", () => requestAnimationFrame(toTop), { once: true });
}

// nav.js
// The fixed top bar:
//  - slides up to a thin strip while you scroll down, comes back when you scroll up
//  - takes the colour of the section you are in and underlines its link
//  - shows reading progress on posts
//  - opens and closes the menu on small screens
//
// Positions are measured on load, resize and layout changes, never while
// scrolling, so each scroll frame is a few comparisons and at most a few writes.
function initNav(nav) {
  const menuButton = nav.querySelector(".menu-button");
  const sectionLinks = [...nav.querySelectorAll('.nav-link[href^="#"]')];
  const allLinks = [...nav.querySelectorAll(".nav-link")];
  const chapters = [...document.querySelectorAll("[data-chapter]")];
  const progress = nav.querySelector(".progress");
  const article = document.querySelector("[data-progress]");

  let starts = [];
  let navHeight = 0;
  let articleStart = 0;
  let articleSpan = 1;
  let lastY = window.scrollY;
  let keyboardFocus = false;
  const shown = { hidden: false, chapter: -1, progress: -1 };

  function measure() {
    const y = window.scrollY;
    const line = window.innerHeight * 0.2;
    navHeight = nav.offsetHeight;
    starts = chapters.map((ch) => ch.getBoundingClientRect().top + y - line);
    if (article) {
      const r = article.getBoundingClientRect();
      articleStart = r.top + y - window.innerHeight * 0.4;
      articleSpan = Math.max(r.height - window.innerHeight * 0.6, 1);
    }
    update();
  }

  function update() {
    const y = window.scrollY;

    const delta = y - lastY;
    let hidden = shown.hidden;
    if (nav.classList.contains("is-open") || keyboardFocus || y < navHeight) hidden = false;
    else if (delta > 6) hidden = true;
    else if (delta < -6) hidden = false;
    if (Math.abs(delta) > 6 || y < navHeight) lastY = y;
    if (hidden !== shown.hidden) {
      nav.classList.toggle("is-hidden", hidden);
      shown.hidden = hidden;
    }

    if (chapters.length) {
      let i = 0;
      while (i + 1 < starts.length && y >= starts[i + 1]) i++;
      if (i !== shown.chapter) {
        shown.chapter = i;
        nav.style.setProperty("--nav-bg", `var(--${chapters[i].dataset.color})`);
        const id = chapters[i].dataset.chapter;
        for (const a of sectionLinks) {
          const current = a.dataset.target === id;
          a.classList.toggle("is-current", current);
          if (current) a.setAttribute("aria-current", "true");
          else a.removeAttribute("aria-current");
        }
      }
    }

    if (progress && article) {
      const p = Math.round(Math.min(Math.max((y - articleStart) / articleSpan, 0), 1) * 1000) / 1000;
      if (p !== shown.progress) {
        progress.style.transform = `scaleX(${p})`;
        shown.progress = p;
      }
    }
  }

  // At most one update per frame; a pending re-measure includes the update.
  let frame = 0;
  let remeasure = false;
  const schedule = (withMeasure) => {
    remeasure ||= withMeasure;
    if (frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      const full = remeasure;
      remeasure = false;
      if (full) measure();
      else update();
    });
  };

  window.addEventListener("scroll", () => schedule(false), { passive: true });
  window.addEventListener("resize", () => {
    if (menuButton && getComputedStyle(menuButton).display === "none") setOpen(false);
    schedule(true);
  });
  window.addEventListener("load", () => schedule(true), { once: true });
  document.fonts?.ready.then(() => schedule(true));
  // Tabs, the carousel, "More" toggles and late images change the page height.
  if ("ResizeObserver" in window) new ResizeObserver(() => schedule(true)).observe(document.body);
  measure();

  // Keep the bar visible while it holds keyboard focus.
  nav.addEventListener("focusin", (e) => {
    keyboardFocus = e.target.matches(":focus-visible");
    if (keyboardFocus) update();
  });
  nav.addEventListener("focusout", () => {
    keyboardFocus = false;
  });

  function setOpen(open) {
    if (open === nav.classList.contains("is-open")) return;
    nav.classList.toggle("is-open", open);
    document.body.classList.toggle("menu-open", open);
    if (menuButton) {
      menuButton.setAttribute("aria-expanded", String(open));
      menuButton.setAttribute("aria-label", open ? "Close menu" : "Menu");
    }
    if (open) {
      nav.classList.remove("is-hidden");
      shown.hidden = false;
    }
  }

  menuButton?.addEventListener("click", () => setOpen(!nav.classList.contains("is-open")));
  for (const a of allLinks) a.addEventListener("click", () => setOpen(false));
  document.addEventListener("click", (e) => {
    if (nav.classList.contains("is-open") && !nav.contains(e.target)) setOpen(false);
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && nav.classList.contains("is-open")) {
      setOpen(false);
      menuButton?.focus();
    }
  });
}

// tabs.js
// Turns a list of in-page links into tabs: one linked panel is shown at a time.
// Any link on the page to a panel (the list itself, "next" links) opens it,
// arrow keys move between tabs, and the URL hash follows so a tab can be shared.
function initTabs(list) {
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

// carousel.js
// One slide at a time with previous/next buttons, arrow keys and swipe.
// Slides are [role="group"] elements; buttons carry data-step="-1" or "1";
// an optional [data-current] element shows the position.
function initCarousel(root) {
  const slides = [...root.querySelectorAll('[role="group"]')];
  const counter = root.querySelector("[data-current]");
  if (slides.length < 2) return;
  let index = 0;

  const show = (i) => {
    index = (i + slides.length) % slides.length;
    slides.forEach((slide, j) => {
      const on = j === index;
      slide.classList.toggle("is-active", on);
      if (on) slide.removeAttribute("aria-hidden");
      else slide.setAttribute("aria-hidden", "true");
    });
    if (counter) counter.textContent = String(index + 1).padStart(2, "0");
  };

  root.classList.add("is-carousel");
  for (const button of root.querySelectorAll("[data-step]")) {
    button.addEventListener("click", () => show(index + Number(button.dataset.step)));
  }
  root.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight") show(index + 1);
    else if (e.key === "ArrowLeft") show(index - 1);
  });

  let startX = null;
  root.addEventListener("touchstart", (e) => {
    startX = e.touches[0].clientX;
  }, { passive: true });
  root.addEventListener("touchend", (e) => {
    if (startX === null) return;
    const dx = e.changedTouches[0].clientX - startX;
    if (Math.abs(dx) > 40) show(index + (dx < 0 ? 1 : -1));
    startX = null;
  });

  show(0);
}

// copy-button.js
// Buttons with data-copy="text" copy that text and say so for a moment.
function initCopyButtons(root) {
  for (const button of root.querySelectorAll("[data-copy]")) {
    const label = button.querySelector("span");
    const idle = label?.textContent ?? "";
    let timer = 0;
    const flash = (message) => {
      if (!label) return;
      label.textContent = message;
      clearTimeout(timer);
      timer = setTimeout(() => (label.textContent = idle), 1600);
    };
    button.addEventListener("click", () => {
      const text = button.dataset.copy || location.href;
      if (!navigator.clipboard?.writeText) return flash("Copy failed");
      navigator.clipboard.writeText(text).then(() => flash("Copied"), () => flash("Copy failed"));
    });
  }
}

// prefetch.js
// Browsers without speculation rules: fetch a same-site page as soon as its
// link is hovered, touched or focused, so opening it feels instant.
function initPrefetch() {
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

// main.js
resetScrollOnFreshLoad();

const nav = document.querySelector(".nav");
if (nav) initNav(nav);

document.querySelectorAll("[data-tabs]").forEach(initTabs);
document.querySelectorAll("[data-carousel]").forEach(initCarousel);
initCopyButtons(document);
initPrefetch();
})();
