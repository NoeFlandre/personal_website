import { getMapRetryDelayMs, shouldRetryMapInit } from "../utils/aboutMap.js";
import { createAboutMapSession } from "./aboutMapSession.js";

export function createAboutMapController({
  leaflet,
  documentRef = globalThis.document,
  windowRef = globalThis.window,
  setTimeoutFn = globalThis.setTimeout,
  clearTimeoutFn = globalThis.clearTimeout,
  consoleRef = globalThis.console,
} = {}) {
  if (!leaflet) {
    throw new TypeError("The About map controller requires a Leaflet adapter");
  }

  let lifecycleController = new AbortController();
  let started = false;

  const getLifecycleSignal = () => {
    if (lifecycleController.signal.aborted) {
      lifecycleController = new AbortController();
    }
    return lifecycleController.signal;
  };

  const scheduleTimeout = (callback, delay) => {
    const signal = getLifecycleSignal();
    const timeoutId = setTimeoutFn(callback, delay);
    signal.addEventListener("abort", () => clearTimeoutFn(timeoutId));
    return timeoutId;
  };

  const mapSession = createAboutMapSession({
    leaflet,
    windowRef,
    setTimeoutFn,
    clearTimeoutFn,
  });

  const init = (root) => {
    if (!root) return;
    if (root.dataset.mapInitState === "ready" || root.dataset.mapInitState === "loading") return;
    root.dataset.mapInitState = "loading";

    const mounted = mapSession.mount(root, getLifecycleSignal());
    if (!mounted) {
      root.dataset.mapInitState = "idle";
      return;
    }

    root.dataset.mapInitState = "ready";
    root.dataset.mapRetryCount = "0";
  };

  const setup = () => {
    documentRef?.querySelectorAll("[data-about-map-root]").forEach((root) => {
      init(root);
    });
  };

  const setupWithRetry = () => {
    documentRef?.querySelectorAll("[data-about-map-root]").forEach((root) => {
      try {
        init(root);
      } catch (error) {
        consoleRef?.error?.("Failed to initialize About map demo", error);
        const retries = Number(root.dataset.mapRetryCount ?? 0);
        if (!shouldRetryMapInit(retries)) return;
        const nextAttempt = retries + 1;
        root.dataset.mapRetryCount = String(nextAttempt);
        scheduleTimeout(() => {
          try {
            delete root.dataset.mapInitState;
            init(root);
          } catch {
            // Follow-up retries are handled by subsequent setup calls or next retry cycle.
          }
        }, getMapRetryDelayMs(nextAttempt));
      }
    });
  };

  const cleanup = () => {
    lifecycleController.abort();
  };

  const start = () => {
    if (started || !documentRef) return;
    started = true;

    if (documentRef.readyState === "loading") {
      documentRef.addEventListener("DOMContentLoaded", setupWithRetry, { once: true });
    } else {
      setupWithRetry();
    }

    documentRef.addEventListener("astro:before-swap", cleanup);
    documentRef.addEventListener("astro:page-load", setupWithRetry);
    documentRef.addEventListener("astro:after-swap", setup);
  };

  return { cleanup, setup, setupWithRetry, start };
}

export function startAboutMap(leaflet, options = {}) {
  const controller = createAboutMapController({ leaflet, ...options });
  controller.start();
  return controller.cleanup;
}
