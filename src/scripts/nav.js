// The fixed top bar:
//  - slides up to a thin strip while you scroll down, comes back when you scroll up
//  - takes the colour of the section you are in and underlines its link
//  - shows reading progress on posts
//  - opens and closes the menu on small screens
//
// Positions are measured on load, resize and layout changes, never while
// scrolling, so each scroll frame is a few comparisons and at most a few writes.
export function initNav(nav) {
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
