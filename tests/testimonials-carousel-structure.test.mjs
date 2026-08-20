import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { runInNewContext } from "node:vm";

const source = readFileSync(
  new URL("../src/components/TestimonialsCarousel.astro", import.meta.url),
  "utf8"
);

test("Johann Desloires is the second linked recommendation", () => {
  const names = [...source.matchAll(/name: "([^"]+)"/g)].map((match) => match[1]);

  assert.equal(names[1], "Johann Desloires");
  assert.match(source, /link: "https:\/\/www\.linkedin\.com\/in\/johann-desloires\/"/);
  assert.match(source, /title: "Geospatial Data Scientist \| EO & ML \| End-to-End Applications"/);
  assert.match(source, /relationship: "Worked with Noé on the same team"/);
  assert.match(source, /date: "August 19, 2026"/);
  assert.match(
    source,
    /quote:\s*"I had the pleasure of meeting Noé during his internship at Airbus Defence and Space/
  );
  assert.match(
    source,
    /I wish Noé all the best for the next steps of his career and would be happy to recommend him\./
  );
});

const scriptMatch = source.match(/<script is:inline>([\s\S]*?)<\/script>/);
assert.ok(scriptMatch, "expected TestimonialsCarousel to include an inline script");
const carouselScript = scriptMatch[1];

function createElement(offsetHeight = 0) {
  return Object.assign(new EventTarget(), {
    attributes: new Map(),
    dataset: {},
    offsetHeight,
    style: {},
    setAttribute(name, value) {
      this.attributes.set(name, value);
    },
  });
}

function runCarousel({ withResizeObserver }) {
  const track = createElement();
  const viewport = createElement();
  const slides = [createElement(120), createElement(160)];
  const dots = [createElement(), createElement()];
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

  let setupCount = 0;
  const document = Object.assign(new EventTarget(), {
    querySelectorAll() {
      setupCount += 1;
      return [root];
    },
    readyState: "complete",
  });
  const window = Object.assign(new EventTarget(), {
    requestAnimationFrame(callback) {
      callback();
      return 1;
    },
  });

  let resizeObserver;
  const context = { document, window };

  if (withResizeObserver) {
    class ResizeObserver {
      constructor() {
        this.disconnectCount = 0;
        this.observed = [];
        resizeObserver = this;
      }

      disconnect() {
        this.disconnectCount += 1;
      }

      observe(element) {
        this.observed.push(element);
      }
    }

    window.ResizeObserver = ResizeObserver;
    context.ResizeObserver = ResizeObserver;
  }

  runInNewContext(carouselScript, context);

  return {
    document,
    getSetupCount: () => setupCount,
    resizeObserver,
    slides,
    viewport,
    window,
  };
}

test("TestimonialsCarousel avoids unused map callback parameters", () => {
  assert.doesNotMatch(source, /testimonials\.map\(\(item,\s*index\)\s*=>\s*\(\s*<li/);
  assert.doesNotMatch(source, /testimonials\.map\(\(item,\s*index\)\s*=>\s*\(\s*<button/);
  assert.match(source, /testimonials\.map\(\(item\)\s*=>\s*\(\s*<li/);
  assert.match(source, /testimonials\.map\(\(_?,?\s*index\)\s*=>\s*\(\s*<button/);
});

test("TestimonialsCarousel disconnects its resize observer before a page swap", () => {
  const { document, resizeObserver, slides } = runCarousel({ withResizeObserver: true });

  assert.equal(resizeObserver.observed.length, slides.length);
  assert.equal(resizeObserver.disconnectCount, 0);

  document.dispatchEvent(new Event("astro:before-swap"));

  assert.equal(resizeObserver.disconnectCount, 1);
});

test("TestimonialsCarousel removes its fallback resize listener before a page swap", () => {
  const { document, slides, viewport, window } = runCarousel({ withResizeObserver: false });

  slides[0].offsetHeight = 140;
  window.dispatchEvent(new Event("resize"));
  assert.equal(viewport.style.height, "140px");

  document.dispatchEvent(new Event("astro:before-swap"));
  slides[0].offsetHeight = 180;
  viewport.style.height = "unchanged";
  window.dispatchEvent(new Event("resize"));

  assert.equal(viewport.style.height, "unchanged");
});

test("TestimonialsCarousel stops handling page loads after its page is swapped out", () => {
  const { document, getSetupCount } = runCarousel({ withResizeObserver: true });

  assert.equal(getSetupCount(), 1);
  document.dispatchEvent(new Event("astro:before-swap"));
  document.dispatchEvent(new Event("astro:page-load"));

  assert.equal(getSetupCount(), 1);
});
