import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { initAboutOutline } from "../src/features/about/client/aboutOutline.js";
import { initPostDetails } from "../src/features/blog/client/postDetailsRerun.js";
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

  removeAttribute(name) {
    this.attributes.delete(name);
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

test("copy feedback reset is canceled when the post lifecycle ends", async () => {
  const document = new FakeDocument();
  const { article, codeBlock } = createCopyArticle();
  document.currentArticle = article;

  await withAsyncGlobals(
    {
      document,
      navigator: { clipboard: { writeText: async () => {} } },
      NodeFilter: { SHOW_TEXT: 4 },
      window: { scrollTo() {} },
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
      await new Promise((resolve) => setTimeout(resolve, 750));

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
