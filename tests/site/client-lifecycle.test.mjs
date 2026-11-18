import assert from "node:assert/strict";
import test from "node:test";
import { initPostDetails } from "../../src/features/blog/client/postDetailsRerun.js";
import { createPostDetailsSession } from "../../src/features/blog/client/postDetailsSession.js";
import * as clientLifecycleUtils from "../../src/utils/clientLifecycle.js";
import { FakeDocument, FakeElement, TrackedEventTarget } from "../helpers/dom-fakes.mjs";
import { readRepoFile } from "../helpers/repo-files.mjs";

const { createClientLifecycle, scheduleAbortableTimeout } = clientLifecycleUtils;

class LifecycleDocument extends FakeDocument {
  constructor() {
    super({ scrollHeight: 100 });
    this.currentArticle = null;
    this.elementsById = new Map();
  }

  querySelector(selector) {
    if (selector === "#article") return this.currentArticle;
    return super.querySelector(selector);
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

test("scheduleAbortableTimeout cancels its timer when the lifecycle aborts", () => {
  const controller = new AbortController();
  const clearTimeoutCalls = [];
  let scheduledCallback;
  let scheduledDelay;

  const timerId = scheduleAbortableTimeout({
    callback: () => undefined,
    clearTimeoutFn: (id) => clearTimeoutCalls.push(id),
    delay: 250,
    setTimeoutFn: (callback, delay) => {
      scheduledCallback = callback;
      scheduledDelay = delay;
      return 17;
    },
    signal: controller.signal,
  });

  assert.equal(timerId, 17);
  assert.equal(typeof scheduledCallback, "function");
  assert.equal(scheduledDelay, 250);

  controller.abort();

  assert.deepEqual(clearTimeoutCalls, [17]);
});

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

test("About layout shows no Jump To Section control", () => {
  const aboutLayout = readRepoFile("src/layouts/AboutLayout.astro");

  assert.doesNotMatch(aboutLayout, /Jump To Section/);
  assert.doesNotMatch(aboutLayout, /about-outline-mobile/);
  assert.doesNotMatch(aboutLayout, /data-outline-link/);
});

test("initPostDetails ignores a missing document or article", () => {
  const document = new LifecycleDocument();

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
  const document = new LifecycleDocument();
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
  const document = new LifecycleDocument();
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
  const document = new LifecycleDocument();
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
  const document = new LifecycleDocument();
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

test("createClientLifecycle cleans up a failed setup before rethrowing", () => {
  const lifecycle = createClientLifecycle();
  const root = {};
  let failedSetupAborted = false;
  let setupCalls = 0;

  assert.throws(
    () =>
      lifecycle.activate(root, (signal) => {
        signal.addEventListener("abort", () => {
          failedSetupAborted = true;
        });
        throw new Error("setup failed");
      }),
    /setup failed/
  );
  assert.equal(failedSetupAborted, true);

  lifecycle.activate({}, () => {
    setupCalls += 1;
  });
  lifecycle.cleanup();
  assert.equal(setupCalls, 1);
});
