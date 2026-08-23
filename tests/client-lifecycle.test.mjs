import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  getFirstVisibleSection,
  getOutlineSectionId,
  initAboutOutline,
} from "../src/features/about/client/aboutOutline.js";
import { initPostDetails } from "../src/features/blog/client/postDetailsRerun.js";
import { createPostDetailsSession } from "../src/features/blog/client/postDetailsSession.js";
import * as clientLifecycleUtils from "../src/utils/clientLifecycle.js";

const { createClientLifecycle } = clientLifecycleUtils;

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
    this.attributes = new Map();
    this.children = [];
    this.dataset = {};
    this.style = {};
    this.parentNode = null;
  }

  appendChild(child) {
    child.parentNode?.removeChild(child);
    child.parentNode = this;
    this.children.push(child);
    return child;
  }

  insertBefore(child, reference) {
    child.parentNode?.removeChild(child);
    const index = this.children.indexOf(reference);
    if (index < 0) return this.appendChild(child);
    child.parentNode = this;
    this.children.splice(index, 0, child);
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

  replaceWith(replacement) {
    const parent = this.parentNode;
    if (!parent) return;
    const index = parent.children.indexOf(this);
    if (index < 0) return;
    replacement.parentNode?.removeChild(replacement);
    replacement.parentNode = parent;
    parent.children[index] = replacement;
    this.parentNode = null;
  }

  setAttribute(name, value) {
    this.attributes.set(name, String(value));
  }

  getAttribute(name) {
    return this.attributes.get(name) ?? null;
  }

  hasAttribute(name) {
    return this.attributes.has(name);
  }

  removeAttribute(name) {
    this.attributes.delete(name);
  }

  contains(target) {
    return target === this || this.children.includes(target);
  }

  scrollIntoView(options) {
    this.scrollIntoViewOptions = options;
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

async function withAsyncGlobals(values, callback) {
  const previous = new Map(
    Object.keys(values).map((key) => [key, Object.getOwnPropertyDescriptor(globalThis, key)])
  );

  for (const [key, value] of Object.entries(values)) {
    Object.defineProperty(globalThis, key, {
      configurable: true,
      value,
      writable: true,
    });
  }

  try {
    return await callback();
  } finally {
    for (const [key, descriptor] of previous) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else delete globalThis[key];
    }
  }
}

function createCopyArticle() {
  const article = new FakeElement();
  const codeBlock = new FakeElement();
  const code = new FakeElement();
  code.innerText = "const answer = 42;";
  codeBlock.querySelector = (selector) => (selector === "code" ? code : null);
  article.querySelectorAll = (selector) => (selector === "pre" ? [codeBlock] : []);
  article.appendChild(codeBlock);
  return { article, codeBlock };
}

test("Astro transition hooks register each callback once", () => {
  const documentRef = new TrackedEventTarget();
  const calls = [];
  const hooks = clientLifecycleUtils.createAstroTransitionHooks();

  assert.equal(
    hooks.ensure(documentRef, {
      onBeforeSwap: () => calls.push("before"),
      onAfterSwap: () => calls.push("after"),
    }),
    true
  );
  assert.equal(
    hooks.ensure(documentRef, {
      onBeforeSwap: () => calls.push("duplicate-before"),
      onAfterSwap: () => calls.push("duplicate-after"),
    }),
    false
  );

  documentRef.dispatchEvent(new Event("astro:before-swap"));
  documentRef.dispatchEvent(new Event("astro:after-swap"));

  assert.deepEqual(calls, ["before", "after"]);
});

test("Astro transition hooks allow omitting the after-swap callback", () => {
  const documentRef = new TrackedEventTarget();
  const calls = [];
  const hooks = clientLifecycleUtils.createAstroTransitionHooks();

  assert.equal(
    hooks.ensure(documentRef, {
      onBeforeSwap: () => calls.push("before"),
    }),
    true
  );
  assert.equal(documentRef.listenerCount("astro:after-swap"), 0);

  documentRef.dispatchEvent(new Event("astro:before-swap"));
  documentRef.dispatchEvent(new Event("astro:after-swap"));

  assert.deepEqual(calls, ["before"]);
});

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

test("About layout reruns its dedicated client module", () => {
  const aboutLayout = read("src/layouts/AboutLayout.astro");

  assert.match(
    aboutLayout,
    /aboutOutlineUrl\s+from\s+"@\/features\/about\/client\/aboutOutline\.js\?url"/
  );
  assert.match(aboutLayout, /data-astro-rerun[\s\S]*aboutOutlineUrl/);
  assert.match(aboutLayout, /data-about-outline-root/);
});

test("initPostDetails ignores a missing document or article", () => {
  const document = new FakeDocument();

  withGlobals({ document: undefined, window: { scrollTo() {} } }, () => {
    assert.doesNotThrow(() => initPostDetails());
  });

  withGlobals({ document, window: { scrollTo() {} } }, () => {
    initPostDetails();
    assert.equal(document.listenerCount("astro:before-swap"), 0);
    assert.equal(document.listenerCount("astro:after-swap"), 0);
    assert.equal(document.body.children.length, 0);
  });
});

test("initPostDetails does not duplicate listeners and cleans up before a swap", () => {
  const document = new FakeDocument();
  const article = new FakeElement();
  document.currentArticle = article;
  const scrollCalls = [];

  withGlobals(
    {
      document,
      NodeFilter: { SHOW_TEXT: 4 },
      window: { scrollTo: (options) => scrollCalls.push(options) },
    },
    () => {
      initPostDetails();
      initPostDetails();

      assert.equal(document.listenerCount("scroll"), 1);
      assert.equal(document.listenerCount("astro:before-swap"), 1);
      assert.equal(document.listenerCount("astro:after-swap"), 1);
      assert.equal(document.body.children.length, 1);

      document.dispatchEvent(new Event("astro:after-swap"));
      assert.deepEqual(scrollCalls, [{ left: 0, top: 0, behavior: "instant" }]);

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

test("post details session mounts and cleans up its browser enhancements", () => {
  const document = new FakeDocument();
  const article = new FakeElement();
  const session = createPostDetailsSession({
    documentRef: document,
    navigatorRef: { clipboard: { writeText: async () => {} } },
    nodeFilterRef: { SHOW_TEXT: 4 },
    windowRef: { scrollTo() {} },
    setTimeoutFn: () => 1,
    clearTimeoutFn: () => {},
  });
  const controller = new AbortController();

  assert.equal(session.mount(article, controller.signal), true);
  assert.equal(document.listenerCount("scroll"), 1);
  assert.equal(document.body.children.length, 1);

  controller.abort();

  assert.equal(document.listenerCount("scroll"), 0);
  assert.equal(document.body.children.length, 0);
});

test("copy feedback reset is canceled when the post lifecycle ends", async () => {
  const document = new FakeDocument();
  const { article, codeBlock } = createCopyArticle();
  document.currentArticle = article;
  const pendingTimers = new Map();
  let nextTimerId = 1;
  const setTimeout = (callback) => {
    const timerId = nextTimerId++;
    pendingTimers.set(timerId, callback);
    return timerId;
  };
  const clearTimeout = (timerId) => {
    pendingTimers.delete(timerId);
  };

  await withAsyncGlobals(
    {
      document,
      navigator: { clipboard: { writeText: async () => {} } },
      NodeFilter: { SHOW_TEXT: 4 },
      window: { scrollTo() {} },
      setTimeout,
      clearTimeout,
    },
    async () => {
      initPostDetails();
      const copyButton = codeBlock.children.find((child) => child.className?.includes("copy-code"));
      assert.ok(copyButton);

      copyButton.dispatchEvent(new Event("click"));
      await Promise.resolve();
      await Promise.resolve();
      assert.equal(copyButton.innerText, "Copied");

      document.currentArticle = null;
      initPostDetails();

      assert.equal(pendingTimers.size, 0);
      assert.equal(copyButton.innerText, "Copied");
    }
  );
});

test("copy completion does not update detached UI after the post lifecycle ends", async () => {
  const document = new FakeDocument();
  const { article, codeBlock } = createCopyArticle();
  document.currentArticle = article;
  let resolveClipboardWrite;
  const clipboardWrite = new Promise((resolve) => {
    resolveClipboardWrite = resolve;
  });

  await withAsyncGlobals(
    {
      document,
      navigator: { clipboard: { writeText: () => clipboardWrite } },
      NodeFilter: { SHOW_TEXT: 4 },
      window: { scrollTo() {} },
    },
    async () => {
      initPostDetails();
      const copyButton = codeBlock.children.find((child) => child.className?.includes("copy-code"));
      assert.ok(copyButton);

      copyButton.dispatchEvent(new Event("click"));
      await Promise.resolve();
      document.currentArticle = null;
      initPostDetails();
      resolveClipboardWrite();
      await Promise.resolve();
      await Promise.resolve();

      assert.notEqual(copyButton.innerText, "Copied");
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

    constructor(callback, ...options) {
      this.callback = callback;
      this.disconnectCount = 0;
      this.options = options[0];
      this.observed = [];
      FakeIntersectionObserver.instances.push(this);
    }

    observe(section) {
      this.observed.push(section);
    }

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
    assert.deepEqual(FakeIntersectionObserver.instances[0].options, {
      rootMargin: "-35% 0px -55% 0px",
      threshold: [0, 1],
    });
    assert.deepEqual(FakeIntersectionObserver.instances[0].observed, [section]);
    assert.equal(document.listenerCount("click"), 0);

    document.dispatchEvent(new Event("astro:before-swap"));

    assert.equal(link.listenerCount("click"), 0);
    assert.equal(FakeIntersectionObserver.instances[0].disconnectCount, 1);

    initAboutOutline();
    assert.equal(link.listenerCount("click"), 1);
    assert.equal(FakeIntersectionObserver.instances.length, 2);
  });
});

test("outline helpers reject non-fragment links and choose the nearest visible section", () => {
  assert.equal(getOutlineSectionId(null), null);
  assert.equal(getOutlineSectionId(""), null);
  assert.equal(getOutlineSectionId("section"), null);
  assert.equal(getOutlineSectionId("#overview"), "overview");

  const first = { id: "first" };
  const second = { id: "second" };
  const hiddenBeforeBoth = { id: "hidden-before-both" };
  assert.equal(
    getFirstVisibleSection([
      { isIntersecting: false, target: hiddenBeforeBoth, boundingClientRect: { top: -10 } },
      { isIntersecting: true, target: second, boundingClientRect: { top: 20 } },
      { isIntersecting: true, target: first, boundingClientRect: { top: 10 } },
    ]),
    first
  );
  assert.equal(getFirstVisibleSection([]), null);
});

test("initAboutOutline skips roots without links or matching sections", () => {
  const document = new FakeDocument();
  const root = new FakeElement();
  root.querySelectorAll = (selector) => {
    if (selector === "[data-outline-link]") return [];
    if (selector === "[data-about-outline-mobile]") return [];
    return [];
  };
  document.querySelector = (selector) => (selector === "[data-about-outline-root]" ? root : null);

  class FakeIntersectionObserver {
    static instances = [];

    constructor() {
      FakeIntersectionObserver.instances.push(this);
    }
  }

  withGlobals({ document, IntersectionObserver: FakeIntersectionObserver }, () => {
    initAboutOutline();
    assert.equal(FakeIntersectionObserver.instances.length, 0);
    assert.equal(document.listenerCount("click"), 0);

    document.querySelector = () => null;
    initAboutOutline();

    const missingRoot = new FakeElement();
    const missingLink = new FakeElement();
    missingLink.getAttribute = (name) => (name === "href" ? "#missing" : null);
    missingRoot.querySelectorAll = (selector) => {
      if (selector === "[data-outline-link]") return [missingLink];
      if (selector === "[data-about-outline-mobile]") return [];
      return [];
    };
    document.querySelector = (selector) =>
      selector === "[data-about-outline-root]" ? missingRoot : null;

    assert.doesNotThrow(() => initAboutOutline());
    assert.equal(FakeIntersectionObserver.instances.length, 0);

    document.querySelector = () => null;
    initAboutOutline();
  });
});

test("createClientLifecycle cleans up a failed setup before rethrowing", () => {
  const lifecycle = createClientLifecycle();
  const root = {};
  let cleanupCalls = 0;

  assert.throws(
    () =>
      lifecycle.activate(root, () => {
        throw new Error("setup failed");
      }),
    /setup failed/
  );

  lifecycle.activate({}, () => {
    cleanupCalls += 1;
  });
  lifecycle.cleanup();
  assert.equal(cleanupCalls, 1);
});

test("initAboutOutline activates visible sections and closes the mobile outline", () => {
  const document = new FakeDocument();
  const root = new FakeElement();
  const link = new FakeElement();
  const otherLink = new FakeElement();
  const invalidLink = new FakeElement();
  const missingLink = new FakeElement();
  const mobileOutline = new FakeElement();
  const section = new FakeElement();
  const otherSection = new FakeElement();
  const outside = new FakeElement();
  link.getAttribute = (name) => (name === "href" ? "#section" : null);
  let closestSelector = null;
  link.closest = (selector) => {
    closestSelector = selector;
    return selector === "[data-about-outline-mobile]" ? mobileOutline : null;
  };
  otherLink.getAttribute = (name) => (name === "href" ? "#other-section" : null);
  otherLink.closest = () => null;
  invalidLink.getAttribute = (name) => (name === "href" ? "section" : null);
  invalidLink.closest = () => null;
  missingLink.getAttribute = (name) => (name === "href" ? "#missing" : null);
  missingLink.closest = () => null;
  section.id = "section";
  otherSection.id = "other-section";
  mobileOutline.setAttribute("open", "");
  mobileOutline.contains = (target) => target === mobileOutline;
  let removeAttributeCalls = 0;
  const removeAttribute = mobileOutline.removeAttribute.bind(mobileOutline);
  mobileOutline.removeAttribute = (name) => {
    removeAttributeCalls += 1;
    removeAttribute(name);
  };
  root.querySelectorAll = (selector) => {
    if (selector === "[data-outline-link]") return [link, otherLink, invalidLink, missingLink];
    if (selector === "[data-about-outline-mobile]") return [mobileOutline];
    return [];
  };
  document.querySelector = (selector) => (selector === "[data-about-outline-root]" ? root : null);
  const lookups = [];
  document.getElementById = (id) => {
    lookups.push(id);
    return (
      new Map([
        ["section", section],
        ["other-section", otherSection],
      ]).get(id) ?? null
    );
  };

  class FakeIntersectionObserver {
    static instances = [];

    constructor(callback, ...options) {
      this.callback = callback;
      this.options = options[0];
      this.observed = [];
      FakeIntersectionObserver.instances.push(this);
    }

    observe(sectionToObserve) {
      this.observed.push(sectionToObserve);
    }

    disconnect() {}
  }

  withGlobals(
    { document, IntersectionObserver: FakeIntersectionObserver, Node: FakeElement },
    () => {
      assert.doesNotThrow(() => initAboutOutline());

      assert.deepEqual(FakeIntersectionObserver.instances[0].options, {
        rootMargin: "-35% 0px -55% 0px",
        threshold: [0, 1],
      });
      assert.deepEqual(FakeIntersectionObserver.instances[0].observed, [section, otherSection]);
      assert.equal(lookups.includes(null), false);
      assert.equal(link.dataset.active, "true");
      assert.equal(otherLink.dataset.active, "false");
      assert.equal(document.listenerCount("click"), 1);

      FakeIntersectionObserver.instances[0].callback([
        { isIntersecting: true, target: section, boundingClientRect: { top: 20 } },
      ]);
      assert.equal(link.dataset.active, "true");

      FakeIntersectionObserver.instances[0].callback([
        { isIntersecting: true, target: otherSection, boundingClientRect: { top: 10 } },
      ]);
      assert.equal(otherLink.dataset.active, "true");
      assert.doesNotThrow(() => FakeIntersectionObserver.instances[0].callback([]));
      assert.equal(otherLink.dataset.active, "true");

      link.dispatchEvent(new Event("click", { cancelable: true }));
      assert.deepEqual(link.scrollIntoViewOptions, undefined);
      assert.deepEqual(section.scrollIntoViewOptions, {
        behavior: "smooth",
        block: "start",
      });
      assert.equal(closestSelector, "[data-about-outline-mobile]");
      assert.equal(mobileOutline.hasAttribute("open"), false);

      const invalidEvent = new Event("click", { cancelable: true });
      const invalidListener = [...invalidLink.listenerEntries.get("click")][0].listener;
      assert.doesNotThrow(() => invalidListener(invalidEvent));
      assert.equal(invalidEvent.defaultPrevented, false);
      assert.equal(lookups.includes(null), false);

      const missingEvent = new Event("click", { cancelable: true });
      const missingListener = [...missingLink.listenerEntries.get("click")][0].listener;
      assert.doesNotThrow(() => missingListener(missingEvent));
      assert.equal(missingEvent.defaultPrevented, false);

      otherLink.dispatchEvent(new Event("click", { cancelable: true }));
      assert.deepEqual(otherSection.scrollIntoViewOptions, {
        behavior: "smooth",
        block: "start",
      });

      const callsBeforeClosedClick = removeAttributeCalls;
      const outsideClick = [...(document.listenerEntries.get("click") ?? [])][0]?.listener;
      outsideClick?.({ target: outside });
      assert.equal(removeAttributeCalls, callsBeforeClosedClick);

      mobileOutline.setAttribute("open", "");
      outsideClick?.({ target: outside });
      assert.equal(mobileOutline.hasAttribute("open"), false);

      mobileOutline.setAttribute("open", "");
      outsideClick?.({ target: mobileOutline });
      assert.equal(mobileOutline.hasAttribute("open"), true);

      outsideClick?.({ target: {} });
      assert.equal(mobileOutline.hasAttribute("open"), true);

      document.querySelector = () => null;
      initAboutOutline();
      assert.equal(document.listenerCount("click"), 0);
    }
  );
});
