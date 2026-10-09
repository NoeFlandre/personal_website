export class TrackedEventTarget extends EventTarget {
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

export class FakeTextNode {
  constructor(textContent) {
    this.nodeType = 3;
    this.parentNode = null;
    this.textContent = textContent;
  }
}

export class FakeElement extends TrackedEventTarget {
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
      remove: (...tokens) => {
        this.className = this.className
          .split(/\s+/)
          .filter((token) => token && !tokens.includes(token))
          .join(" ");
      },
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

export class FakeDocument extends TrackedEventTarget {
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

  createTextNode(value) {
    return new FakeTextNode(value);
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
