import assert from "node:assert/strict";
import test from "node:test";
import { createPostDetailsSession } from "../src/features/blog/client/postDetailsSession.js";

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
    signal?.addEventListener("abort", () => entries.delete(entry), { once: true });
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

  emit(type, event = {}) {
    for (const { listener } of this.listenerEntries.get(type) ?? []) {
      listener.call(this, event);
    }
  }
}

class FakeTextNode {
  constructor(textContent) {
    this.nodeType = 3;
    this.parentNode = null;
    this.textContent = textContent;
  }
}

class FakeElement extends TrackedEventTarget {
  constructor(tagName = "div") {
    super();
    this.dataset = {};
    this.tagName = tagName.toUpperCase();
    this.nodeType = 1;
    this.attributes = new Map();
    this.children = [];
    this.parentNode = null;
    this.style = {};
    this._innerHTML = "";
    this._textContent = null;
    this.classList = {
      add: (...tokens) => {
        this.className = [...new Set(`${this.className} ${tokens.join(" ")}`.trim().split(/\s+/))]
          .filter(Boolean)
          .join(" ");
      },
      contains: (token) => this.className.split(/\s+/).includes(token),
    };
  }

  get id() {
    return this.getAttribute("id") ?? "";
  }

  set id(value) {
    this.setAttribute("id", value);
  }

  get href() {
    return this.getAttribute("href") ?? "";
  }

  set href(value) {
    this.setAttribute("href", value);
  }

  get className() {
    return this.getAttribute("class") ?? "";
  }

  set className(value) {
    this.setAttribute("class", value);
  }

  get firstChild() {
    return this.children[0] ?? null;
  }

  get firstElementChild() {
    return this.children.find((child) => child.nodeType === 1) ?? null;
  }

  get textContent() {
    if (this._textContent !== null) return this._textContent;
    return this.children.map((child) => child.textContent ?? "").join("");
  }

  set textContent(value) {
    this._textContent = String(value);
  }

  get innerText() {
    return this.textContent;
  }

  set innerText(value) {
    this.textContent = value;
  }

  get innerHTML() {
    return this._innerHTML;
  }

  set innerHTML(value) {
    this._innerHTML = String(value);
    this.children = [];

    const tag = this._innerHTML.match(/<([a-z][\w-]*)/i)?.[1];
    if (!tag) return;

    const child = new FakeElement(tag);
    const className = this._innerHTML.match(/class=["']([^"']+)["']/i)?.[1];
    if (className) child.className = className;
    this.appendChild(child);
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

  removeAttribute(name) {
    this.attributes.delete(name);
  }

  matches(selector) {
    return selector
      .split(",")
      .map((part) => part.trim())
      .some((part) => {
        if (part === "input") return this.tagName === "INPUT";
        if (part === "textarea") return this.tagName === "TEXTAREA";
        if (part === '[contenteditable="true"]') {
          return this.getAttribute("contenteditable") === "true";
        }
        if (part === "img:not([loading])") {
          return this.tagName === "IMG" && !this.getAttribute("loading");
        }
        if (part === "[data-prev-url]") return this.getAttribute("data-prev-url") !== null;
        if (part === "[data-next-url]") return this.getAttribute("data-next-url") !== null;
        if (part === ".copy-code") return this.classList.contains("copy-code");
        if (part === ".heading-link") return this.classList.contains("heading-link");
        if (part === ".youtube-embed-container") {
          return this.classList.contains("youtube-embed-container");
        }
        if (part === ".progress-container[data-post-progress]") {
          return (
            this.classList.contains("progress-container") && this.dataset.postProgress === "true"
          );
        }
        if (part.startsWith("#")) return this.id === part.slice(1);
        return this.tagName === part.toUpperCase();
      });
  }

  querySelectorAll(selector) {
    const directSelector = selector.startsWith(":scope > ")
      ? selector.slice(":scope > ".length)
      : null;
    const candidates = directSelector ? this.children : descendantsOf(this);
    return candidates.filter(
      (candidate) => candidate.nodeType === 1 && candidate.matches(directSelector ?? selector)
    );
  }

  querySelector(selector) {
    return this.querySelectorAll(selector)[0] ?? null;
  }
}

class FakeDocument extends TrackedEventTarget {
  constructor({ clientHeight = 100, scrollHeight = 300 } = {}) {
    super();
    this.body = new FakeElement("body");
    this.body.scrollTop = 0;
    this.documentElement = { clientHeight, scrollHeight, scrollTop: 0 };
  }

  createElement(tagName) {
    return new FakeElement(tagName);
  }

  createTreeWalker(root) {
    const nodes = [];
    const visit = (node) => {
      for (const child of node.children ?? []) {
        if (child.nodeType === 3) nodes.push(child);
        else visit(child);
      }
    };
    visit(root);

    let index = 0;
    return { nextNode: () => nodes[index++] ?? null };
  }

  querySelector(selector) {
    return this.body.querySelector(selector);
  }

  getElementById(id) {
    return this.body.querySelector(`#${id}`);
  }
}

function descendantsOf(element) {
  const descendants = [];
  const visit = (node) => {
    for (const child of node.children ?? []) {
      descendants.push(child);
      if (child.nodeType === 1) visit(child);
    }
  };
  visit(element);
  return descendants;
}

function createHarness(options = {}) {
  const documentRef = new FakeDocument(options);
  const article = new FakeElement("article");
  documentRef.body.appendChild(article);

  const timers = new Map();
  const clearedTimers = [];
  let nextTimerId = 1;
  const setTimeoutFn = (callback, delay) => {
    const id = nextTimerId++;
    timers.set(id, { callback, delay });
    return id;
  };
  const clearTimeoutFn = (id) => {
    clearedTimers.push(id);
    timers.delete(id);
  };

  const clipboardWrites = [];
  const windowRef = { location: { href: "" }, scrollTo() {} };
  const session = createPostDetailsSession({
    clearTimeoutFn,
    documentRef,
    navigatorRef: { clipboard: { writeText: async (value) => clipboardWrites.push(value) } },
    nodeFilterRef: { SHOW_TEXT: 4 },
    setTimeoutFn,
    windowRef,
  });

  return {
    article,
    clipboardWrites,
    clearedTimers,
    documentRef,
    runNextTimer() {
      const [id, timer] = timers.entries().next().value ?? [];
      if (id === undefined) return false;
      timers.delete(id);
      timer.callback();
      return true;
    },
    session,
    timers,
    windowRef,
  };
}

function mount(harness) {
  const controller = new AbortController();
  assert.equal(harness.session.mount(harness.article, controller.signal), true);
  return controller;
}

test("mount rejects missing article, signal, or document dependencies", () => {
  const harness = createHarness();
  const controller = new AbortController();

  assert.equal(harness.session.mount(null, controller.signal), false);
  assert.equal(harness.session.mount(harness.article, null), false);
  assert.equal(
    createPostDetailsSession({ documentRef: null }).mount(harness.article, controller.signal),
    false
  );
});

test("scroll progress is initialized and clamped at both bounds", () => {
  const harness = createHarness();
  harness.documentRef.body.scrollTop = 100;
  const controller = mount(harness);
  const progressBar = harness.documentRef.getElementById("myBar");

  assert.equal(progressBar.style.width, "50%");

  harness.documentRef.body.scrollTop = 500;
  harness.documentRef.emit("scroll");
  assert.equal(progressBar.style.width, "100%");

  harness.documentRef.body.scrollTop = -100;
  harness.documentRef.emit("scroll");
  assert.equal(progressBar.style.width, "0%");

  harness.documentRef.documentElement.scrollHeight = 100;
  harness.documentRef.emit("scroll");
  assert.equal(progressBar.style.width, "0%");

  controller.abort();
});

test("heading links are added with accessible labels and removed on abort", () => {
  const harness = createHarness();
  const heading = new FakeElement("h2");
  heading.id = "overview";
  harness.article.appendChild(heading);
  const controller = mount(harness);

  const link = heading.querySelector(".heading-link");
  assert.ok(link);
  assert.equal(link.getAttribute("href"), "#overview");
  assert.equal(link.firstElementChild.ariaHidden, "true");
  assert.equal(link.firstElementChild.innerText, "#");

  controller.abort();
  assert.equal(heading.querySelector(".heading-link"), null);
});

test("existing copy buttons are not duplicated", () => {
  const harness = createHarness();
  const codeBlock = new FakeElement("pre");
  const existingButton = new FakeElement("button");
  existingButton.className = "copy-code";
  codeBlock.appendChild(existingButton);
  harness.article.appendChild(codeBlock);
  const controller = mount(harness);

  assert.equal(codeBlock.querySelectorAll(".copy-code").length, 1);
  assert.equal(codeBlock.getAttribute("tabindex"), null);

  controller.abort();
});

test("copy buttons write code, show feedback, and restore their label", async () => {
  const harness = createHarness();
  const codeBlock = new FakeElement("pre");
  const code = new FakeElement("code");
  code.innerText = "const answer = 42;";
  codeBlock.appendChild(code);
  harness.article.appendChild(codeBlock);
  const controller = mount(harness);
  const copyButton = codeBlock.querySelector(".copy-code");

  copyButton.dispatchEvent(new Event("click"));
  await Promise.resolve();
  await Promise.resolve();

  assert.deepEqual(harness.clipboardWrites, ["const answer = 42;"]);
  assert.equal(copyButton.innerText, "Copied");
  assert.equal(harness.timers.size, 1);
  assert.equal(harness.runNextTimer(), true);
  assert.equal(copyButton.innerText, "Copy");

  controller.abort();
});

test("aborting a copy session clears feedback timers and restores the code block", async () => {
  const harness = createHarness();
  const codeBlock = new FakeElement("pre");
  const code = new FakeElement("code");
  code.innerText = "print('hello')";
  codeBlock.appendChild(code);
  harness.article.appendChild(codeBlock);
  const controller = mount(harness);
  const copyButton = codeBlock.querySelector(".copy-code");

  copyButton.dispatchEvent(new Event("click"));
  await Promise.resolve();
  await Promise.resolve();
  controller.abort();

  assert.equal(harness.clearedTimers.length, 1);
  assert.equal(codeBlock.parentNode, harness.article);
  assert.equal(codeBlock.querySelector(".copy-code"), null);
  assert.equal(codeBlock.getAttribute("tabindex"), null);
});

test("back-to-top resets both document scroll positions", () => {
  const harness = createHarness();
  const backToTop = new FakeElement("button");
  backToTop.id = "back-to-top";
  harness.documentRef.body.appendChild(backToTop);
  const controller = mount(harness);

  harness.documentRef.body.scrollTop = 140;
  harness.documentRef.documentElement.scrollTop = 140;
  backToTop.dispatchEvent(new Event("click"));

  assert.equal(harness.documentRef.body.scrollTop, 0);
  assert.equal(harness.documentRef.documentElement.scrollTop, 0);

  controller.abort();
});

test("only images without an existing loading attribute become lazy", () => {
  const harness = createHarness();
  const lazyImage = new FakeElement("img");
  const eagerImage = new FakeElement("img");
  eagerImage.setAttribute("loading", "eager");
  harness.article.appendChild(lazyImage);
  harness.article.appendChild(eagerImage);
  const controller = mount(harness);

  assert.equal(lazyImage.getAttribute("loading"), "lazy");
  assert.equal(eagerImage.getAttribute("loading"), "eager");

  controller.abort();
});

test("keyboard navigation follows j and k while ignoring editable targets", () => {
  const harness = createHarness();
  const navigation = new FakeElement("nav");
  navigation.setAttribute("data-prev-url", "/previous");
  navigation.setAttribute("data-next-url", "/next");
  harness.documentRef.body.appendChild(navigation);
  const controller = mount(harness);
  const input = new FakeElement("input");

  harness.documentRef.emit("keydown", { key: "j", target: input });
  assert.equal(harness.windowRef.location.href, "");

  harness.documentRef.emit("keydown", { key: "j", target: harness.article });
  assert.equal(harness.windowRef.location.href, "/next");

  harness.documentRef.emit("keydown", { key: "k", target: harness.article });
  assert.equal(harness.windowRef.location.href, "/previous");

  controller.abort();
  assert.equal(harness.documentRef.listenerCount("keydown"), 0);
});

test("paragraph YouTube tags become responsive embed elements", () => {
  const harness = createHarness();
  const paragraph = new FakeElement("p");
  paragraph.textContent = "Watch this: {% youtube dQw4w9WgXcQ %}";
  harness.article.appendChild(paragraph);
  const controller = mount(harness);

  assert.equal(harness.article.querySelectorAll("p").length, 0);
  assert.equal(harness.article.querySelectorAll(".youtube-embed-container").length, 1);

  controller.abort();
});

test("YouTube tags inside text nodes are replaced without leaving the source text", () => {
  const harness = createHarness();
  const textNode = new FakeTextNode("Before {% youtube dQw4w9WgXcQ %} after");
  harness.article.appendChild(textNode);
  const controller = mount(harness);

  assert.equal(harness.article.children.includes(textNode), false);
  assert.equal(harness.article.querySelectorAll(".youtube-embed-container").length, 1);

  controller.abort();
});

test("mount keeps cleanup available when embed processing throws", () => {
  const harness = createHarness();
  harness.documentRef.createTreeWalker = () => {
    throw new Error("tree walker unavailable");
  };
  const controller = new AbortController();

  assert.throws(
    () => harness.session.mount(harness.article, controller.signal),
    /tree walker unavailable/
  );
  controller.abort();

  assert.equal(harness.documentRef.listenerCount("scroll"), 0);
  assert.equal(
    harness.documentRef.body.querySelector(".progress-container[data-post-progress]"),
    null
  );
});
