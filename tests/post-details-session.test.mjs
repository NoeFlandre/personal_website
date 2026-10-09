import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { createPostDetailsSession } from "../src/features/blog/client/postDetailsSession.js";
import { FakeDocument, FakeElement, FakeTextNode } from "./helpers/dom-fakes.mjs";

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

test("scroll progress updates the bar it created without looking it up by id", () => {
  const harness = createHarness();
  harness.documentRef.body.scrollTop = 100;
  const controller = mount(harness);
  const progressBar = harness.documentRef.getElementById("myBar");

  progressBar.removeAttribute("id");
  harness.documentRef.body.scrollTop = 150;
  harness.documentRef.emit("scroll");
  assert.equal(progressBar.style.width, "75%");

  controller.abort();
});

test("heading links are added with accessible labels and removed on abort", () => {
  const harness = createHarness();
  const heading = new FakeElement("h2");
  heading.id = "overview";
  heading.textContent = "  Overview  ";
  harness.article.appendChild(heading);
  const controller = mount(harness);

  const link = heading.querySelector(".heading-link");
  assert.ok(link);
  assert.equal(heading.className, "group");
  assert.equal(link.getAttribute("href"), "#overview");
  assert.equal(link.getAttribute("aria-label"), "Link to Overview section");
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
  assert.equal(heading.classList.contains("group"), false);
});

test("heading link labels fall back to the heading id when text is unavailable", () => {
  const harness = createHarness();
  const heading = new FakeElement("h2");
  heading.id = "fallback";
  Object.defineProperty(heading, "textContent", {
    configurable: true,
    get: () => null,
  });
  harness.article.appendChild(heading);

  const controller = mount(harness);
  assert.equal(
    heading.querySelector(".heading-link").getAttribute("aria-label"),
    "Link to fallback section"
  );
  controller.abort();
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
  assert.equal(harness.timers.values().next().value.delay, 700);
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

test("keyboard navigation ignores modifier shortcuts and key repeat", () => {
  const harness = createHarness();
  const navigation = new FakeElement("nav");
  navigation.setAttribute("data-prev-url", "/previous");
  navigation.setAttribute("data-next-url", "/next");
  harness.documentRef.body.appendChild(navigation);
  const controller = mount(harness);

  harness.documentRef.emit("keydown", { ctrlKey: true, key: "k", target: harness.article });
  harness.documentRef.emit("keydown", { metaKey: true, key: "k", target: harness.article });
  harness.documentRef.emit("keydown", { altKey: true, key: "j", target: harness.article });
  harness.documentRef.emit("keydown", { key: "j", repeat: true, target: harness.article });
  assert.equal(harness.windowRef.location.href, "");

  harness.documentRef.emit("keydown", { key: "j", target: harness.article });
  assert.equal(harness.windowRef.location.href, "/next");

  controller.abort();
});

test("keyboard navigation ignores keys inside inherited contenteditable regions", () => {
  const harness = createHarness();
  const navigation = new FakeElement("nav");
  navigation.setAttribute("data-prev-url", "/previous");
  navigation.setAttribute("data-next-url", "/next");
  harness.documentRef.body.appendChild(navigation);
  const controller = mount(harness);
  const editorChild = new FakeElement("span");
  editorChild.isContentEditable = true;

  harness.documentRef.emit("keydown", { key: "j", target: editorChild });
  assert.equal(harness.windowRef.location.href, "");

  controller.abort();
});

test("paragraph YouTube tags become responsive embed elements", () => {
  const harness = createHarness();
  const paragraph = new FakeElement("p");
  const urlParagraph = new FakeElement("p");
  const plainParagraph = new FakeElement("p");
  paragraph.appendChild(new FakeTextNode("{% youtube dQw4w9WgXcQ %}"));
  urlParagraph.appendChild(new FakeTextNode("{% youtube https://youtu.be/dQw4w9WgXcQ?t=42 %}"));
  plainParagraph.appendChild(new FakeTextNode("No video here"));
  harness.article.appendChild(paragraph);
  harness.article.appendChild(urlParagraph);
  harness.article.appendChild(plainParagraph);
  const controller = mount(harness);

  assert.equal(harness.article.querySelectorAll(".youtube-embed-container").length, 2);
  assert.equal(
    paragraph.querySelector("iframe").getAttribute("src"),
    "https://www.youtube.com/embed/dQw4w9WgXcQ"
  );
  assert.equal(
    urlParagraph.querySelector("iframe").getAttribute("src"),
    "https://www.youtube.com/embed/dQw4w9WgXcQ"
  );
  assert.equal(plainParagraph.querySelector("iframe"), null);
  assert.equal(plainParagraph.textContent, "No video here");

  controller.abort();
});

test("YouTube tags keep the prose around them in the same paragraph", () => {
  const harness = createHarness();
  const paragraph = new FakeElement("p");
  paragraph.appendChild(new FakeTextNode("Watch this: {% youtube dQw4w9WgXcQ %}"));
  harness.article.appendChild(paragraph);
  const controller = mount(harness);

  assert.equal(paragraph.parentNode, harness.article);
  assert.equal(paragraph.children[0].nodeType, 3);
  assert.equal(paragraph.children[0].textContent, "Watch this: ");
  assert.equal(
    paragraph.querySelector("iframe").getAttribute("src"),
    "https://www.youtube.com/embed/dQw4w9WgXcQ"
  );

  controller.abort();
});

test("every YouTube tag in a paragraph is replaced", () => {
  const harness = createHarness();
  const paragraph = new FakeElement("p");
  paragraph.appendChild(
    new FakeTextNode("{% youtube dQw4w9WgXcQ %} and {% youtube https://youtu.be/abc123XYZ %}")
  );
  harness.article.appendChild(paragraph);
  const controller = mount(harness);

  assert.deepEqual(
    paragraph.querySelectorAll("iframe").map((iframe) => iframe.getAttribute("src")),
    ["https://www.youtube.com/embed/dQw4w9WgXcQ", "https://www.youtube.com/embed/abc123XYZ"]
  );
  assert.equal(paragraph.children[1].textContent, " and ");

  controller.abort();
});

test("text around YouTube tags is inserted as literal text, not parsed as HTML", () => {
  const harness = createHarness();
  harness.article.appendChild(new FakeTextNode('1 < 2 <img src="x"> {% youtube dQw4w9WgXcQ %}'));
  const controller = mount(harness);

  assert.equal(harness.article.querySelectorAll("img").length, 0);
  assert.equal(harness.article.children[0].nodeType, 3);
  assert.equal(harness.article.children[0].textContent, '1 < 2 <img src="x"> ');
  assert.equal(harness.article.querySelectorAll("iframe").length, 1);

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
  assert.equal(harness.article.querySelectorAll("iframe").length, 2);

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

test("helpers take documentRef before signal and copy buttons take a deps object", () => {
  const source = readFileSync(
    new URL("../src/features/blog/client/postDetailsSession.js", import.meta.url),
    "utf8"
  );

  assert.doesNotMatch(source, /\bsignal,\s*documentRef\b/);
  assert.match(source, /function attachCopyButtons\(\s*article,\s*\{[^}]*\}\s*\)/);
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
