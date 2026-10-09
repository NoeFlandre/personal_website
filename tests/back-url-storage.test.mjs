import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { BACK_URL_KEY, getBackUrl, setBackUrl } from "../src/utils/backUrl.js";

function read(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

function fakeStorage(initial = {}) {
  const items = new Map(Object.entries(initial));
  return {
    getItem: (key) => items.get(key) ?? null,
    setItem: (key, value) => items.set(key, String(value)),
  };
}

function withSessionStorage(getStorage, run) {
  const original = Object.getOwnPropertyDescriptor(globalThis, "sessionStorage");
  Object.defineProperty(globalThis, "sessionStorage", { configurable: true, get: getStorage });
  try {
    return run();
  } finally {
    if (original) {
      Object.defineProperty(globalThis, "sessionStorage", original);
    } else {
      delete globalThis.sessionStorage;
    }
  }
}

test("the back URL storage key is backUrl", () => {
  assert.equal(BACK_URL_KEY, "backUrl");
});

test("setBackUrl stores the URL and getBackUrl reads it back", () => {
  const storage = fakeStorage();

  withSessionStorage(
    () => storage,
    () => {
      assert.equal(getBackUrl(), null);
      setBackUrl("/posts");
      assert.equal(storage.getItem(BACK_URL_KEY), "/posts");
      assert.equal(getBackUrl(), "/posts");
    }
  );
});

test("reads and writes do not throw when sessionStorage access is blocked", () => {
  withSessionStorage(
    () => {
      throw new DOMException("Storage is disabled", "SecurityError");
    },
    () => {
      assert.equal(getBackUrl(), null);
      assert.doesNotThrow(() => setBackUrl("/"));
    }
  );
});

test("reads and writes do not throw when the storage calls themselves fail", () => {
  const failingStorage = {
    getItem() {
      throw new Error("read failed");
    },
    setItem() {
      throw new DOMException("Quota exceeded", "QuotaExceededError");
    },
  };

  withSessionStorage(
    () => failingStorage,
    () => {
      assert.equal(getBackUrl(), null);
      assert.doesNotThrow(() => setBackUrl("/posts"));
    }
  );
});

test("call sites read and write the back URL through the helper", () => {
  for (const path of [
    "src/components/BackButton.astro",
    "src/layouts/Main.astro",
    "src/pages/index.astro",
  ]) {
    const source = read(path);

    assert.doesNotMatch(source, /sessionStorage/, path);
    assert.doesNotMatch(source, /"backUrl"/, path);
    assert.match(source, /from "@\/utils\/backUrl\.js"/, path);
  }
});
