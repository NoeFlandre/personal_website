import { createClientLifecycle } from "../../../utils/clientLifecycle.js";

const lifecycle = createClientLifecycle();
let transitionHooksBound = false;

function ensureTransitionHooks() {
  if (transitionHooksBound) return;

  document.addEventListener("astro:before-swap", () => lifecycle.cleanup());
  transitionHooksBound = true;
}

export function initAboutOutline() {
  const root = document.querySelector("[data-about-outline-root]");

  if (!root) {
    lifecycle.cleanup();
    return;
  }

  ensureTransitionHooks();

  lifecycle.activate(root, (signal) => {
    const links = Array.from(root.querySelectorAll("[data-outline-link]"));
    const mobileOutlines = Array.from(root.querySelectorAll("[data-about-outline-mobile]"));
    const sectionMap = new Map();

    links.forEach((link) => {
      const href = link.getAttribute("href");
      if (!href || !href.startsWith("#")) return;
      const section = document.getElementById(href.slice(1));
      if (!section) return;
      sectionMap.set(section.id, section);
    });

    const sections = Array.from(sectionMap.values());

    if (links.length === 0 || sections.length === 0) return;

    const setActive = (id) => {
      links.forEach((link) => {
        const isActive = link.getAttribute("href") === `#${id}`;
        link.dataset.active = isActive ? "true" : "false";
      });
    };

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

        if (visible.length > 0) {
          setActive(visible[0].target.id);
        }
      },
      {
        rootMargin: "-35% 0px -55% 0px",
        threshold: [0, 1],
      }
    );

    signal.addEventListener("abort", () => observer.disconnect(), { once: true });

    sections.forEach((section) => {
      observer.observe(section);
    });
    setActive(sections[0].id);

    links.forEach((link) => {
      link.addEventListener(
        "click",
        (event) => {
          const href = link.getAttribute("href");
          if (!href || !href.startsWith("#")) return;
          const section = document.getElementById(href.slice(1));
          if (!section) return;
          event.preventDefault();
          section.scrollIntoView({ behavior: "smooth", block: "start" });
          setActive(section.id);

          const mobileDropdown = link.closest("[data-about-outline-mobile]");
          if (mobileDropdown) {
            mobileDropdown.removeAttribute("open");
          }
        },
        { signal }
      );
    });

    if (mobileOutlines.length > 0) {
      document.addEventListener(
        "click",
        (event) => {
          const target = event.target;
          if (!(target instanceof Node)) return;

          mobileOutlines.forEach((mobileOutline) => {
            if (!mobileOutline.hasAttribute("open")) return;
            if (mobileOutline.contains(target)) return;
            mobileOutline.removeAttribute("open");
          });
        },
        { signal }
      );
    }
  });
}
