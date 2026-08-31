import { createClientLifecycle } from "../../../utils/clientLifecycle.js";

function getCarouselElements(root) {
  return {
    dots: Array.from(root.querySelectorAll("[data-dot]")),
    next: root.querySelector('[data-action="next"]'),
    prev: root.querySelector('[data-action="prev"]'),
    slides: Array.from(root.querySelectorAll("[data-slide]")),
    track: root.querySelector("[data-track]"),
    viewport: root.querySelector("[data-carousel-viewport]"),
  };
}

function hasCarouselElements({ next, prev, slides, track, viewport }) {
  return slides.length > 0 && [next, prev, track, viewport].every(Boolean);
}

function setActiveState(element, isActive) {
  element.setAttribute("aria-hidden", isActive ? "false" : "true");
  if (isActive) {
    element.removeAttribute("inert");
  } else {
    element.setAttribute("inert", "");
  }
}

function setActiveDot(dot, isActive) {
  const value = isActive ? "true" : "false";
  dot.setAttribute("data-active", value);
  dot.setAttribute("aria-pressed", value);
}

function observeSlideSizes({ signal, slides, syncViewportHeight, windowRef }) {
  const ResizeObserverConstructor = windowRef.ResizeObserver;
  if (typeof ResizeObserverConstructor !== "function") {
    windowRef.addEventListener("resize", syncViewportHeight, { signal });
    return;
  }

  const resizeObserver = new ResizeObserverConstructor(syncViewportHeight);
  slides.forEach((slide) => {
    resizeObserver.observe(slide);
  });
  signal.addEventListener("abort", () => resizeObserver.disconnect(), { once: true });
}

export function mountTestimonialsCarousel(root, { signal, windowRef }) {
  if (!root || root.dataset.carouselInit === "true") return false;
  root.dataset.carouselInit = "true";

  const { dots, next, prev, slides, track, viewport } = getCarouselElements(root);
  if (!hasCarouselElements({ next, prev, slides, track, viewport })) return false;

  let index = 0;

  const syncViewportHeight = () => {
    const activeSlide = slides[index];
    if (!activeSlide) return;
    viewport.style.height = "auto";
    viewport.style.height = `${activeSlide.offsetHeight}px`;
  };

  const update = () => {
    track.style.transform = `translateX(-${index * 100}%)`;
    slides.forEach((slide, slideIndex) => {
      setActiveState(slide, slideIndex === index);
    });
    dots.forEach((dot, dotIndex) => {
      setActiveDot(dot, dotIndex === index);
    });
    windowRef.requestAnimationFrame(syncViewportHeight);
  };

  prev.addEventListener(
    "click",
    () => {
      index = (index - 1 + slides.length) % slides.length;
      update();
    },
    { signal }
  );
  next.addEventListener(
    "click",
    () => {
      index = (index + 1) % slides.length;
      update();
    },
    { signal }
  );
  dots.forEach((dot, dotIndex) => {
    dot.addEventListener(
      "click",
      () => {
        index = dotIndex;
        update();
      },
      { signal }
    );
  });

  observeSlideSizes({ signal, slides, syncViewportHeight, windowRef });
  update();
  return true;
}

export function startTestimonialsCarousels(
  documentRef = globalThis.document,
  windowRef = globalThis.window
) {
  if (!documentRef || !windowRef) return null;

  const lifecycle = createClientLifecycle();
  const setup = () => {
    const roots = Array.from(documentRef.querySelectorAll("[data-testimonial-carousel]"));
    if (roots.length === 0) {
      lifecycle.cleanup();
      return false;
    }

    return lifecycle.activate(roots[0], (signal) => {
      roots.forEach((root) => {
        mountTestimonialsCarousel(root, { signal, windowRef });
      });
    });
  };
  const cleanup = () => lifecycle.cleanup();

  documentRef.addEventListener("astro:page-load", setup);
  documentRef.addEventListener("astro:before-swap", cleanup);
  setup();

  return () => {
    cleanup();
    documentRef.removeEventListener("astro:page-load", setup);
    documentRef.removeEventListener("astro:before-swap", cleanup);
  };
}
