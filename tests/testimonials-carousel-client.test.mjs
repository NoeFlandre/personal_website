import assert from "node:assert/strict";
import test from "node:test";

import {
  mountTestimonialsCarousel,
  startTestimonialsCarousels,
} from "../src/features/about/client/testimonialsCarousel.js";

function createElement(offsetHeight = 0) {
  return Object.assign(new EventTarget(), {
    attributes: new Map(),
    dataset: {},
    offsetHeight,
    style: {},
    setAttribute(name, value) {
      this.attributes.set(name, value);
    },
    removeAttribute(name) {
      this.attributes.delete(name);
    },
  });
}

function createCarouselRoot({ dotCount, slideHeights = [120, 160] } = {}) {
  const track = createElement();
  const viewport = createElement();
  const viewportHeightAssignments = [];
  let viewportHeight;
  Object.defineProperty(viewport.style, "height", {
    configurable: true,
    get() {
      return viewportHeight;
    },
    set(value) {
      viewportHeightAssignments.push(value);
      viewportHeight = value;
    },
  });

  const slides = slideHeights.map((height) => createElement(height));
  const dots = Array.from({ length: dotCount ?? slides.length }, () => createElement());
  const prev = createElement();
  const next = createElement();
  const root = createElement();

  root.querySelector = (selector) =>
    ({
      '[data-action="next"]': next,
      '[data-action="prev"]': prev,
      "[data-carousel-viewport]": viewport,
      "[data-track]": track,
    })[selector] ?? null;
  root.querySelectorAll = (selector) =>
    ({
      "[data-dot]": dots,
      "[data-slide]": slides,
    })[selector] ?? [];

  return {
    dots,
    next,
    prev,
    root,
    slides,
    track,
    viewport,
    viewportHeightAssignments,
  };
}

function createEnvironment({ withResizeObserver = true } = {}) {
  let roots = [createCarouselRoot()];
  const observers = [];
  const addedDocumentListeners = [];
  const removedDocumentListeners = [];
  let queryCount = 0;

  const documentRef = Object.assign(new EventTarget(), {
    querySelectorAll(selector) {
      assert.equal(selector, "[data-testimonial-carousel]");
      queryCount += 1;
      return roots.map(({ root }) => root);
    },
  });
  const addDocumentEventListener = documentRef.addEventListener.bind(documentRef);
  const removeDocumentEventListener = documentRef.removeEventListener.bind(documentRef);
  documentRef.addEventListener = (type, listener, options) => {
    addedDocumentListeners.push({ listener, type });
    addDocumentEventListener(type, listener, options);
  };
  documentRef.removeEventListener = (type, listener, options) => {
    removedDocumentListeners.push({ listener, type });
    removeDocumentEventListener(type, listener, options);
  };
  const windowRef = Object.assign(new EventTarget(), {
    requestAnimationFrame(callback) {
      callback();
      return 1;
    },
  });

  if (withResizeObserver) {
    windowRef.ResizeObserver = class {
      constructor(callback) {
        this.callback = callback;
        this.disconnectCount = 0;
        this.observed = [];
        observers.push(this);
      }

      disconnect() {
        this.disconnectCount += 1;
      }

      observe(element) {
        this.observed.push(element);
      }
    };
  }

  return {
    addedDocumentListeners,
    documentRef,
    getDocumentListener(type) {
      return addedDocumentListeners.find((entry) => entry.type === type)?.listener;
    },
    getQueryCount: () => queryCount,
    observers,
    removedDocumentListeners,
    replaceRoots(nextRoots) {
      roots = nextRoots;
    },
    roots,
    windowRef,
  };
}

test("mountTestimonialsCarousel preserves navigation, accessibility, and sizing behavior", () => {
  const { dots, next, prev, root, slides, track, viewport, viewportHeightAssignments } =
    createCarouselRoot();
  const { observers, windowRef } = createEnvironment();
  const controller = new AbortController();

  assert.equal(mountTestimonialsCarousel(root, { signal: controller.signal, windowRef }), true);
  assert.equal(root.dataset.carouselInit, "true");
  assert.equal(mountTestimonialsCarousel(root, { signal: controller.signal, windowRef }), false);
  assert.equal(observers.length, 1);
  assert.equal(track.style.transform, "translateX(-0%)");
  assert.equal(viewport.style.height, "120px");
  assert.deepEqual(viewportHeightAssignments.slice(0, 2), ["auto", "120px"]);
  assert.equal(slides[0].attributes.get("aria-hidden"), "false");
  assert.equal(slides[0].attributes.get("inert"), undefined);
  assert.equal(slides[1].attributes.get("aria-hidden"), "true");
  assert.equal(slides[1].attributes.get("inert"), "");
  assert.equal(dots[0].attributes.get("aria-pressed"), "true");
  assert.equal(dots[1].attributes.get("aria-pressed"), "false");
  assert.equal(dots[0].attributes.get("data-active"), "true");
  assert.equal(dots[1].attributes.get("data-active"), "false");
  assert.deepEqual(observers[0].observed, slides);

  next.dispatchEvent(new Event("click"));
  assert.equal(track.style.transform, "translateX(-100%)");
  assert.equal(viewport.style.height, "160px");
  assert.equal(slides[0].attributes.get("inert"), "");
  assert.equal(slides[1].attributes.get("inert"), undefined);

  next.dispatchEvent(new Event("click"));
  assert.equal(track.style.transform, "translateX(-0%)");
  prev.dispatchEvent(new Event("click"));
  assert.equal(track.style.transform, "translateX(-100%)");
  dots[0].dispatchEvent(new Event("click"));
  assert.equal(track.style.transform, "translateX(-0%)");

  controller.abort();
  assert.equal(observers[0].disconnectCount, 1);
  controller.signal.dispatchEvent(new Event("abort"));
  assert.equal(observers[0].disconnectCount, 1);
  next.dispatchEvent(new Event("click"));
  prev.dispatchEvent(new Event("click"));
  dots[1].dispatchEvent(new Event("click"));
  assert.equal(track.style.transform, "translateX(-0%)");
});

test("mountTestimonialsCarousel rejects missing or duplicate carousel structures", () => {
  const { windowRef } = createEnvironment();
  const controller = new AbortController();

  assert.equal(mountTestimonialsCarousel(null, { signal: controller.signal, windowRef }), false);

  const emptyCarousel = createCarouselRoot();
  const queryAll = emptyCarousel.root.querySelectorAll;
  emptyCarousel.root.querySelectorAll = (selector) =>
    selector === "[data-slide]" ? [] : queryAll(selector);
  assert.equal(
    mountTestimonialsCarousel(emptyCarousel.root, { signal: controller.signal, windowRef }),
    false
  );

  const incompleteCarousel = createCarouselRoot();
  const queryOne = incompleteCarousel.root.querySelector;
  incompleteCarousel.root.querySelector = (selector) =>
    selector === '[data-action="next"]' ? null : queryOne(selector);
  assert.equal(
    mountTestimonialsCarousel(incompleteCarousel.root, { signal: controller.signal, windowRef }),
    false
  );
});

test("mountTestimonialsCarousel handles non-slide dots and reverse navigation", () => {
  const mismatched = createCarouselRoot({ dotCount: 3 });
  const firstController = new AbortController();
  const firstEnvironment = createEnvironment();

  assert.equal(
    mountTestimonialsCarousel(mismatched.root, {
      signal: firstController.signal,
      windowRef: firstEnvironment.windowRef,
    }),
    true
  );
  mismatched.dots[2].dispatchEvent(new Event("click"));
  assert.equal(mismatched.track.style.transform, "translateX(-200%)");
  assert.equal(mismatched.viewport.style.height, "120px");
  firstController.abort();

  const threeSlides = createCarouselRoot({ slideHeights: [100, 120, 140] });
  const secondController = new AbortController();
  const secondEnvironment = createEnvironment();
  assert.equal(
    mountTestimonialsCarousel(threeSlides.root, {
      signal: secondController.signal,
      windowRef: secondEnvironment.windowRef,
    }),
    true
  );
  threeSlides.prev.dispatchEvent(new Event("click"));
  assert.equal(threeSlides.track.style.transform, "translateX(-200%)");
  assert.equal(threeSlides.viewport.style.height, "140px");
  secondController.abort();
});

test("mountTestimonialsCarousel removes its fallback resize listener on abort", () => {
  const { root, slides, viewport } = createCarouselRoot();
  const { windowRef } = createEnvironment({ withResizeObserver: false });
  const controller = new AbortController();

  assert.equal(mountTestimonialsCarousel(root, { signal: controller.signal, windowRef }), true);

  slides[0].offsetHeight = 140;
  windowRef.dispatchEvent(new Event("resize"));
  assert.equal(viewport.style.height, "140px");

  controller.abort();
  slides[0].offsetHeight = 180;
  viewport.style.height = "unchanged";
  windowRef.dispatchEvent(new Event("resize"));
  assert.equal(viewport.style.height, "unchanged");
});

test("startTestimonialsCarousels remounts after Astro navigation and stops cleanly", () => {
  const environment = createEnvironment();
  const firstRoot = environment.roots[0];

  const stop = startTestimonialsCarousels(environment.documentRef, environment.windowRef);

  assert.equal(typeof stop, "function");
  assert.equal(environment.getQueryCount(), 1);
  assert.equal(firstRoot.root.dataset.carouselInit, "true");
  assert.equal(environment.observers.length, 1);

  environment.documentRef.dispatchEvent(new Event("astro:page-load"));
  assert.equal(environment.getQueryCount(), 2);
  assert.equal(environment.observers.length, 1);

  environment.documentRef.dispatchEvent(new Event("astro:before-swap"));
  assert.equal(environment.observers[0].disconnectCount, 1);

  const secondRoot = createCarouselRoot();
  environment.replaceRoots([secondRoot]);
  environment.documentRef.dispatchEvent(new Event("astro:page-load"));
  assert.equal(secondRoot.root.dataset.carouselInit, "true");
  assert.equal(environment.observers.length, 2);

  stop();
  assert.equal(environment.observers[1].disconnectCount, 1);
  assert.deepEqual(
    environment.removedDocumentListeners.map(({ type }) => type),
    ["astro:page-load", "astro:before-swap"]
  );
  environment.replaceRoots([createCarouselRoot()]);
  environment.documentRef.dispatchEvent(new Event("astro:page-load"));
  assert.equal(environment.observers.length, 2);
});

test("startTestimonialsCarousels handles missing globals and absent roots", () => {
  const availableEnvironment = createEnvironment();
  assert.equal(startTestimonialsCarousels(availableEnvironment.documentRef, null), null);
  assert.equal(startTestimonialsCarousels(null, availableEnvironment.windowRef), null);

  const activeEnvironment = createEnvironment();
  const stopActive = startTestimonialsCarousels(
    activeEnvironment.documentRef,
    activeEnvironment.windowRef
  );
  activeEnvironment.replaceRoots([]);
  assert.equal(activeEnvironment.getDocumentListener("astro:page-load")(), false);
  assert.equal(activeEnvironment.observers[0].disconnectCount, 1);
  stopActive();

  const environment = createEnvironment();
  environment.replaceRoots([]);
  const stop = startTestimonialsCarousels(environment.documentRef, environment.windowRef);

  assert.equal(typeof stop, "function");
  assert.equal(environment.observers.length, 0);
  assert.equal(environment.getDocumentListener("astro:page-load")(), false);
  stop();
});
