import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { initAboutOutline } from "../src/features/about/client/aboutOutline.js";
import { initPostDetails } from "../src/features/blog/client/postDetailsRerun.js";
import { initSearch } from "../src/features/search/client/search.js";
import { createClientLifecycle } from "../src/utils/clientLifecycle.js";

function read(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

class TrackedEventTarget extends EventTarget {
  constructor() {
    super();
    this.listenerEntries = new Map();
  }

  addEventListener(type, listener, options) {
    super.addEventListener(type, listener, options);

    const entry = { listener };
    const entries = this.listenerEntries.get(type) ?? new Set();
    entries.add(entry);
    this.listenerEntries.set(type, entries);

    const signal = typeof options === "object" ? options?.signal : undefined;
    signal?.addEventListener(
      "abort",
      () => {
        entries.delete(entry);
      },
      { once: true }
    );
  }

  removeEventListener(type, listener, options) {
    super.removeEventListener(type, listener, options);
    const entries = this.listenerEntries.get(type);
    entries?.forEach((entry) => {
      if (entry.listener === listener) entries.delete(entry);
    });
  }

  listenerCount(type) {
    return this.listenerEntries.get(type)?.size ?? 0;
  }
}

class FakeElement extends TrackedEventTarget {
  constructor() {
    super();
    this.children = [];
    this.dataset = {};
    this.style = {};
    this.parentNode = null;
  }

  appendChild(child) {
    child.parentNode = this;
    this.children.push(child);
    return child;
  }

  removeChild(child) {
    const index = this.children.indexOf(child);
    if (index >= 0) this.children.splice(index, 1);
    child.parentNode = null;
    return child;
  }

  remove() {
    this.parentNode?.removeChild(this);
  }

  querySelector() {
    return null;
  }

  querySelectorAll() {
    return [];
  }
}

class FakeDocument extends TrackedEventTarget {
  constructor() {
    super();
    this.body = new FakeElement();
    this.documentElement = {
      clientHeight: 100,
      scrollHeight: 100,
      scrollTop: 0,
    };
    this.currentArticle = null;
    this.elementsById = new Map();
  }

  createElement() {
    return new FakeElement();
  }

  createTreeWalker() {
    return { nextNode: () => null };
  }

  querySelector(selector) {
    if (selector === "#article") return this.currentArticle;
    if (selector === ".progress-container[data-post-progress]") {
      return this.body.children.find((child) => child.dataset.postProgress === "true") ?? null;
    }
    return null;
  }

  getElementById(id) {
    return this.elementsById.get(id) ?? null;
  }
}

function withGlobals(values, callback) {
  const previous = new Map(Object.keys(values).map((key) => [key, globalThis[key]]));

  Object.assign(globalThis, values);

  try {
    return callback();
  } finally {
    for (const [key, value] of previous) {
      if (value === undefined) delete globalThis[key];
      else globalThis[key] = value;
    }
  }
}

test("createClientLifecycle activates one root and aborts it before the next", () => {
  const lifecycle = createClientLifecycle();
  const firstRoot = {};
  const secondRoot = {};
  let setupCount = 0;
  let abortCount = 0;

  assert.equal(
    lifecycle.activate(firstRoot, (signal) => {
      setupCount += 1;
      signal.addEventListener("abort", () => {
        abortCount += 1;
      });
    }),
    true
  );
  assert.equal(
    lifecycle.activate(firstRoot, () => setupCount++),
    false
  );
  assert.equal(setupCount, 1);

  assert.equal(
    lifecycle.activate(secondRoot, () => setupCount++),
    true
  );
  assert.equal(abortCount, 1);

  lifecycle.cleanup();
  assert.equal(abortCount, 1);
  assert.equal(setupCount, 2);
});

test("About and search layouts rerun their dedicated client modules", () => {
  const aboutLayout = read("src/layouts/AboutLayout.astro");
  const searchPage = read("src/pages/search.astro");

  assert.match(
    aboutLayout,
    /aboutOutlineUrl\s+from\s+"@\/features\/about\/client\/aboutOutline\.js\?url"/
  );
  assert.match(aboutLayout, /data-astro-rerun[\s\S]*aboutOutlineUrl/);
  assert.match(aboutLayout, /data-about-outline-root/);
  assert.match(searchPage, /searchUrl\s+from\s+"@\/features\/search\/client\/search\.js\?url"/);
  assert.match(searchPage, /data-astro-rerun[\s\S]*searchUrl/);
});

test("initPostDetails does not duplicate listeners and cleans up before a swap", () => {
  const document = new FakeDocument();
  const article = new FakeElement();
  document.currentArticle = article;

  withGlobals(
    {
      document,
      NodeFilter: { SHOW_TEXT: 4 },
      window: { scrollTo() {} },
    },
    () => {
      initPostDetails();
      initPostDetails();

      assert.equal(document.listenerCount("scroll"), 1);
      assert.equal(document.listenerCount("astro:before-swap"), 1);
      assert.equal(document.listenerCount("astro:after-swap"), 1);
      assert.equal(document.body.children.length, 1);

      document.dispatchEvent(new Event("astro:before-swap"));

      assert.equal(document.listenerCount("scroll"), 0);
      assert.equal(document.body.children.length, 0);

      document.currentArticle = new FakeElement();
      initPostDetails();
      assert.equal(document.listenerCount("scroll"), 1);
      assert.equal(document.listenerCount("astro:before-swap"), 1);
      assert.equal(document.body.children.length, 1);
    }
  );
});

test("initAboutOutline initializes one root once and reconnects after a swap", () => {
  const document = new FakeDocument();
  const root = new FakeElement();
  const link = new FakeElement();
  const section = new FakeElement();
  link.getAttribute = (name) => (name === "href" ? "#section" : null);
  link.closest = () => null;
  section.id = "section";
  root.querySelectorAll = (selector) => {
    if (selector === "[data-outline-link]") return [link];
    if (selector === "[data-about-outline-mobile]") return [];
    return [];
  };
  document.querySelector = (selector) => (selector === "[data-about-outline-root]" ? root : null);
  document.elementsById.set("section", section);

  class FakeIntersectionObserver {
    static instances = [];

    constructor() {
      this.disconnectCount = 0;
      FakeIntersectionObserver.instances.push(this);
    }

    observe() {}

    disconnect() {
      this.disconnectCount += 1;
    }
  }

  withGlobals({ document, IntersectionObserver: FakeIntersectionObserver }, () => {
    initAboutOutline();
    initAboutOutline();

    assert.equal(document.listenerCount("astro:before-swap"), 1);
    assert.equal(link.listenerCount("click"), 1);
    assert.equal(FakeIntersectionObserver.instances.length, 1);

    document.dispatchEvent(new Event("astro:before-swap"));

    assert.equal(link.listenerCount("click"), 0);
    assert.equal(FakeIntersectionObserver.instances[0].disconnectCount, 1);

    initAboutOutline();
    assert.equal(link.listenerCount("click"), 1);
    assert.equal(FakeIntersectionObserver.instances.length, 2);
  });
});

test("initSearch schedules one Pagefind initialization per root and cancels it on swap", () => {
  const document = new FakeDocument();
  const root = new FakeElement();
  const idleCallbacks = [];
  const cancelledIdleIds = [];
  document.querySelector = (selector) => (selector === "#pagefind-search" ? root : null);

  withGlobals(
    {
      document,
      window: {
        location: { search: "" },
        requestIdleCallback(callback) {
          idleCallbacks.push(callback);
          return idleCallbacks.length;
        },
        cancelIdleCallback(id) {
          cancelledIdleIds.push(id);
        },
      },
    },
    () => {
      initSearch();
      initSearch();

      assert.equal(idleCallbacks.length, 1);
      assert.equal(document.listenerCount("astro:before-swap"), 1);

      document.dispatchEvent(new Event("astro:before-swap"));

      assert.deepEqual(cancelledIdleIds, [1]);

      initSearch();
      assert.equal(idleCallbacks.length, 2);
      assert.equal(document.listenerCount("astro:before-swap"), 1);
    }
  );
});
