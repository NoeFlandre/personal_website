/**
 * Schedules a timeout that is cleared when the signal aborts.
 *
 * @template TimeoutId
 * @param {{
 *   callback: () => void,
 *   clearTimeoutFn: (timeoutId: TimeoutId) => void,
 *   delay: number,
 *   setTimeoutFn: (callback: () => void, delay: number) => TimeoutId,
 *   signal: AbortSignal,
 * }} options
 * @returns {TimeoutId} The id returned by setTimeoutFn.
 */
export function scheduleAbortableTimeout({
  callback,
  clearTimeoutFn,
  delay,
  setTimeoutFn,
  signal,
}) {
  const timeoutId = setTimeoutFn(callback, delay);
  signal.addEventListener("abort", () => clearTimeoutFn(timeoutId));
  return timeoutId;
}

export function createAstroTransitionHooks() {
  let hooksBound = false;

  return {
    ensure(documentRef, { onBeforeSwap, onAfterSwap } = {}) {
      if (hooksBound) return false;

      documentRef.addEventListener("astro:before-swap", onBeforeSwap);
      if (onAfterSwap) {
        documentRef.addEventListener("astro:after-swap", onAfterSwap);
      }
      hooksBound = true;
      return true;
    },
  };
}

export function createClientLifecycle() {
  let activeRoot = null;
  let activeCleanup = null;

  const cleanup = () => {
    const cleanupActive = activeCleanup;
    activeRoot = null;
    activeCleanup = null;
    cleanupActive?.();
  };

  return {
    activate(root, setup) {
      if (root === activeRoot) return false;

      cleanup();

      const controller = new AbortController();
      activeRoot = root;
      activeCleanup = () => controller.abort();

      try {
        setup(controller.signal);
      } catch (error) {
        cleanup();
        throw error;
      }

      return true;
    },
    cleanup,
  };
}
