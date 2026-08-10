import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import { runInNewContext } from "node:vm";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const themeScript = read("public/toggle-theme.js");
const now = Date.UTC(2026, 7, 10, 10);
const hourInMilliseconds = 60 * 60 * 1000;

class FixedDate extends Date {
  static now() {
    return now;
  }
}

function runThemeScript({ initialStorage = {}, withViewTransitions = false } = {}) {
  const storage = new Map(Object.entries(initialStorage));
  const rootAttributes = new Map();
  const buttonAttributes = new Map();
  const loadHandlers = [];
  let existingLoadHandlerCalls = 0;
  let clickHandler;

  const button = {
    addEventListener(eventName, handler) {
      if (eventName === "click") clickHandler = handler;
    },
    setAttribute(name, value) {
      buttonAttributes.set(name, value);
    },
  };

  const document = {
    body: { style: {} },
    documentElement: {
      setAttribute(name, value) {
        rootAttributes.set(name, value);
      },
    },
    addEventListener() {},
    querySelector(selector) {
      return selector === "#theme-btn" ? button : null;
    },
  };

  if (withViewTransitions) {
    document.startViewTransition = (update) => update();
  }

  const localStorage = {
    getItem(key) {
      return storage.get(key) ?? null;
    },
    removeItem(key) {
      storage.delete(key);
    },
    setItem(key, value) {
      storage.set(key, value);
    },
  };
  const window = {
    addEventListener(eventName, handler) {
      if (eventName === "load") loadHandlers.push(handler);
    },
    onload() {
      existingLoadHandlerCalls += 1;
    },
  };

  runInNewContext(themeScript, { Date: FixedDate, document, localStorage, window });
  window.onload();
  for (const loadHandler of loadHandlers) loadHandler();

  return {
    click() {
      assert.ok(clickHandler, "theme button should have a click handler");
      clickHandler();
    },
    getButtonLabel: () => buttonAttributes.get("aria-label"),
    getColorScheme: () => document.body.style.colorScheme,
    getExistingLoadHandlerCalls: () => existingLoadHandlerCalls,
    getStoredValue: (key) => storage.get(key) ?? null,
    getTheme: () => rootAttributes.get("data-theme"),
  };
}

test("the active theme toggle stays owned by Header and its early script", () => {
  assert.equal(existsSync(new URL("../src/components/ThemeToggle.astro", import.meta.url)), false);

  const header = read("src/components/Header.astro");
  const layout = read("src/layouts/Layout.astro");

  assert.match(header, /id="theme-btn"/);
  assert.match(layout, /<script\s+is:inline\s+src="\/toggle-theme\.js"><\/script>/);
  assert.match(themeScript, /document\.querySelector\("#theme-btn"\)/);
});

test("theme initialization preserves an existing window load handler", () => {
  const theme = runThemeScript();

  assert.equal(theme.getExistingLoadHandlerCalls(), 1);
});

test("theme script defaults to dark without saving an automatic preference", () => {
  const theme = runThemeScript();

  assert.equal(theme.getTheme(), "dark");
  assert.equal(theme.getButtonLabel(), "dark");
  assert.equal(theme.getColorScheme(), "dark");
  assert.equal(theme.getStoredValue("theme"), null);
  assert.equal(theme.getStoredValue("themeSetTimestamp"), null);
});

test("theme script honors a fresh manual preference", () => {
  const timestamp = String(now - 23 * hourInMilliseconds);
  const theme = runThemeScript({
    initialStorage: { theme: "light", themeSetTimestamp: timestamp },
  });

  assert.equal(theme.getTheme(), "light");
  assert.equal(theme.getStoredValue("theme"), "light");
  assert.equal(theme.getStoredValue("themeSetTimestamp"), timestamp);
});

test("theme script clears an expired preference and returns to dark", () => {
  const theme = runThemeScript({
    initialStorage: {
      theme: "light",
      themeSetTimestamp: String(now - 25 * hourInMilliseconds),
    },
  });

  assert.equal(theme.getTheme(), "dark");
  assert.equal(theme.getStoredValue("theme"), null);
  assert.equal(theme.getStoredValue("themeSetTimestamp"), null);
});

test("theme clicks persist the toggled preference in both rendering paths", () => {
  for (const withViewTransitions of [false, true]) {
    const theme = runThemeScript({ withViewTransitions });

    theme.click();

    assert.equal(theme.getTheme(), "light");
    assert.equal(theme.getButtonLabel(), "light");
    assert.equal(theme.getColorScheme(), "light");
    assert.equal(theme.getStoredValue("theme"), "light");
    assert.equal(theme.getStoredValue("themeSetTimestamp"), String(now));
  }
});

test("theme script keeps one manual preference path", () => {
  assert.doesNotMatch(themeScript, /function getSystemTheme/);
  assert.match(themeScript, /function setPreference\(\)/);
  assert.doesNotMatch(themeScript, /isManualChange|setPreference\(true\)/);
});

test("theme timestamp parsing declares a decimal radix", () => {
  assert.match(themeScript, /parseInt\(themeSetTimestamp, 10\)/);
});
