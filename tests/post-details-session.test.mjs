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
  static replaceWithCalls = 0;

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

  get childNodes() {
    return this.children;
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
    FakeElement.replaceWithCalls += 1;
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
    this.createdElements = [];
    this.treeWalkerArgs = null;
  }

  createElement(tagName) {
    const element = new FakeElement(tagName);
    this.createdElements.push(element);
    return element;
  }

  createTreeWalker(...args) {
    this.treeWalkerArgs = args;
    const [root] = args;
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
  harness.documentRef.body.scrollTop = 10;
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
  assert.equal(heading.className, "group");
  assert.equal(link.getAttribute("href"), "#overview");
  assert.equal(link.tagName, "A");
  assert.equal(
    link.className,
    "heading-link ml-2 opacity-0 group-hover:opacity-100 focus:opacity-100"
  );
  assert.equal(link.firstElementChild.ariaHidden, "true");
  assert.equal(link.firstElementChild.innerText, "#");
  assert.equal(link.firstElementChild.tagName, "SPAN");

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

test("progress bars keep their semantic structure and are not duplicated", () => {
  const existingHarness = createHarness();
  const existingContainer = new FakeElement("div");
  existingContainer.className = "progress-container";
  existingContainer.dataset.postProgress = "true";
  existingHarness.documentRef.body.appendChild(existingContainer);
  const existingController = mount(existingHarness);
  assert.equal(
    existingHarness.documentRef.body.querySelectorAll(".progress-container[data-post-progress]")
      .length,
    1
  );
  existingController.abort();

  const harness = createHarness();
  const controller = mount(harness);
  const container = harness.documentRef.body.querySelector(
    ".progress-container[data-post-progress]"
  );
  const progressBar = harness.documentRef.getElementById("myBar");

  assert.ok(container);
  assert.equal(container.tagName, "DIV");
  assert.equal(container.className, "progress-container fixed top-0 z-10 h-1 w-full bg-background");
  assert.equal(container.dataset.postProgress, "true");
  assert.equal(progressBar.tagName, "DIV");
  assert.equal(progressBar.className, "progress-bar h-1 w-0 bg-accent");
  controller.abort();
});

test("heading generation skips headings without ids and existing heading links", () => {
  const harness = createHarness();
  const withoutId = new FakeElement("h2");
  const withExistingLink = new FakeElement("h3");
  withExistingLink.id = "existing";
  const existingLink = new FakeElement("a");
  existingLink.className = "heading-link";
  withExistingLink.appendChild(existingLink);
  harness.article.appendChild(withoutId);
  harness.article.appendChild(withExistingLink);

  const controller = mount(harness);

  assert.equal(withoutId.querySelector(".heading-link"), null);
  assert.equal(withExistingLink.querySelectorAll(".heading-link").length, 1);
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
  const wrapper = codeBlock.parentNode;

  assert.equal(wrapper.tagName, "DIV");
  assert.equal(wrapper.style.position, "relative");
  assert.equal(copyButton.tagName, "BUTTON");
  assert.equal(
    copyButton.className,
    "copy-code absolute right-3 -top-3 rounded bg-muted px-2 py-1 text-xs leading-4 text-foreground font-medium"
  );
  assert.equal(codeBlock.getAttribute("tabindex"), "0");

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

  copyButton.dispatchEvent(new Event("click"));
  await Promise.resolve();
  assert.deepEqual(harness.clipboardWrites, ["print('hello')"]);
});

test("copying a block without a code child writes an empty string", async () => {
  const harness = createHarness();
  const codeBlock = new FakeElement("pre");
  harness.article.appendChild(codeBlock);
  const controller = mount(harness);
  const copyButton = codeBlock.querySelector(".copy-code");

  copyButton.dispatchEvent(new Event("click"));
  await Promise.resolve();
  await Promise.resolve();

  assert.deepEqual(harness.clipboardWrites, [""]);
  controller.abort();
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
  harness.documentRef.body.scrollTop = 8;
  harness.documentRef.documentElement.scrollTop = 8;
  backToTop.dispatchEvent(new Event("click"));
  assert.equal(harness.documentRef.body.scrollTop, 8);
  assert.equal(harness.documentRef.documentElement.scrollTop, 8);
});

test("copy cleanup handles a detached code block without replacing it", () => {
  const harness = createHarness();
  const codeBlock = new FakeElement("pre");
  harness.article.querySelectorAll = (selector) => (selector === "pre" ? [codeBlock] : []);
  FakeElement.replaceWithCalls = 0;

  const controller = mount(harness);
  assert.doesNotThrow(() => controller.abort());
  assert.equal(FakeElement.replaceWithCalls, 0);
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

  harness.documentRef.emit("keydown", { key: "x", target: harness.article });
  assert.equal(harness.windowRef.location.href, "/previous");

  controller.abort();
  assert.equal(harness.documentRef.listenerCount("keydown"), 0);
});

test("paragraph YouTube tags become responsive embed elements", () => {
  const harness = createHarness();
  const paragraph = new FakeElement("p");
  const urlParagraph = new FakeElement("p");
  const plainParagraph = new FakeElement("p");
  paragraph.textContent = "Watch this: {% youtube dQw4w9WgXcQ %}";
  urlParagraph.textContent = "Watch this: {% youtube https://youtu.be/dQw4w9WgXcQ?t=42 %}";
  plainParagraph.textContent = "No video here";
  harness.article.appendChild(paragraph);
  harness.article.appendChild(urlParagraph);
  harness.article.appendChild(plainParagraph);
  const controller = mount(harness);

  assert.equal(harness.article.querySelectorAll("p").length, 1);
  assert.equal(harness.article.querySelectorAll(".youtube-embed-container").length, 2);
  assert.equal(
    harness.documentRef.createdElements.some((element) =>
      element.innerHTML.includes("youtube.com/embed/dQw4w9WgXcQ")
    ),
    true
  );
  assert.equal(harness.documentRef.createdElements.at(-1).tagName, "DIV");

  controller.abort();
});

test("YouTube tags inside text nodes are replaced without leaving the source text", () => {
  const harness = createHarness();
  const plainTextNode = new FakeTextNode("No video here");
  const textNode = new FakeTextNode("Before {% youtube dQw4w9WgXcQ %} after");
  const urlTextNode = new FakeTextNode(
    "Before {% youtube https://youtu.be/dQw4w9WgXcQ?t=42 %} after"
  );
  harness.article.appendChild(plainTextNode);
  harness.article.appendChild(textNode);
  harness.article.appendChild(urlTextNode);
  const controller = mount(harness);

  assert.equal(harness.article.children.includes(textNode), false);
  assert.equal(harness.article.children.includes(plainTextNode), true);
  assert.equal(harness.article.querySelectorAll(".youtube-embed-container").length, 2);
  assert.equal(harness.documentRef.treeWalkerArgs[0], harness.article);
  assert.equal(harness.documentRef.treeWalkerArgs[1], 4);
  assert.equal(harness.documentRef.treeWalkerArgs[2], null);
  assert.equal(harness.documentRef.createdElements.at(-1).tagName, "DIV");

  controller.abort();
});

test("embed processing tolerates a missing NodeFilter dependency", () => {
  const harness = createHarness();
  const session = createPostDetailsSession({
    clearTimeoutFn: (id) => harness.clearedTimers.push(id),
    documentRef: harness.documentRef,
    navigatorRef: { clipboard: { writeText: async () => undefined } },
    nodeFilterRef: null,
    setTimeoutFn: () => 1,
    windowRef: harness.windowRef,
  });

  assert.doesNotThrow(() => session.mount(harness.article, new AbortController().signal));
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
