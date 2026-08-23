import {
  createAstroTransitionHooks,
  createClientLifecycle,
} from "../../../utils/clientLifecycle.js";

const lifecycle = createClientLifecycle();
const transitionHooks = createAstroTransitionHooks();

export function getOutlineSectionId(href) {
  if (!href || !href.startsWith("#")) return null;
  return href.slice(1);
}

export function getFirstVisibleSection(entries) {
  const visible = entries
    .filter((entry) => entry.isIntersecting)
    .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
  return visible[0]?.target ?? null;
}

function ensureTransitionHooks() {
  transitionHooks.ensure(document, {
    onBeforeSwap: () => lifecycle.cleanup(),
  });
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
      const sectionId = getOutlineSectionId(link.getAttribute("href"));
      if (sectionId === null) return;
      const section = document.getElementById(sectionId);
      if (!section) return;
      sectionMap.set(section.id, section);
    });

    const sections = Array.from(sectionMap.values());

    if (sections.length === 0) return;

    const setActive = (id) => {
      links.forEach((link) => {
        const isActive = link.getAttribute("href") === `#${id}`;
        link.dataset.active = isActive ? "true" : "false";
      });
    };

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleSection = getFirstVisibleSection(entries);
        if (visibleSection) {
          setActive(visibleSection.id);
        }
      },
      {
        rootMargin: "-35% 0px -55% 0px",
        threshold: [0, 1],
      }
    );

    signal.addEventListener("abort", () => observer.disconnect());

    sections.forEach((section) => {
      observer.observe(section);
    });
    setActive(sections[0].id);

    links.forEach((link) => {
      link.addEventListener(
        "click",
        (event) => {
          const sectionId = getOutlineSectionId(link.getAttribute("href"));
          if (sectionId === null) return;
          const section = document.getElementById(sectionId);
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
