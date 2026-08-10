import { createClientLifecycle } from "../../../utils/clientLifecycle.js";

const lifecycle = createClientLifecycle();
let transitionHooksBound = false;
let pagefindImportPromise;
let activeSearch;

function ensureTransitionHooks() {
  if (transitionHooksBound) return;

  document.addEventListener("astro:before-swap", () => lifecycle.cleanup());
  transitionHooksBound = true;
}

function scheduleIdle(callback, signal) {
  if (window.requestIdleCallback) {
    const idleId = window.requestIdleCallback(callback);
    signal.addEventListener("abort", () => window.cancelIdleCallback?.(idleId), { once: true });
    return;
  }

  const timeoutId = window.setTimeout(callback, 1);
  signal.addEventListener("abort", () => window.clearTimeout(timeoutId), { once: true });
}

function loadPagefind() {
  pagefindImportPromise ??= import("@pagefind/default-ui");
  return pagefindImportPromise;
}

function attachSearchControls(root, search, params, signal) {
  const query = params.get("q");
  if (query) {
    search?.triggerSearch(query);
  }

  const searchInput = document.querySelector(".pagefind-ui__search-input");
  const clearButton = document.querySelector(".pagefind-ui__search-clear");

  if (searchInput) {
    searchInput.focus();
    searchInput.placeholder = "Search posts, e.g. 'Swift concurrency'";
  }

  const resetSearchParam = (event) => {
    if (event.target?.value?.trim() === "") {
      history.replaceState(history.state, "", window.location.pathname);
    }
  };

  searchInput?.addEventListener("input", resetSearchParam, { signal });
  clearButton?.addEventListener("click", resetSearchParam, { signal });

  const backUrl = root.dataset?.backurl;
  if (backUrl && query) {
    sessionStorage.setItem("backUrl", `${backUrl}?${params.toString()}`);
  }
}

export function initSearch() {
  const root = document.querySelector("#pagefind-search");

  if (!root) {
    lifecycle.cleanup();
    return;
  }

  ensureTransitionHooks();

  lifecycle.activate(root, (signal) => {
    const params = new URLSearchParams(window.location.search);
    const existingForm = root.querySelector("form");

    if (existingForm && activeSearch?.root === root) {
      attachSearchControls(root, activeSearch.search, params, signal);
      return;
    }

    scheduleIdle(async () => {
      if (signal.aborted || root.querySelector("form")) return;

      try {
        const { PagefindUI } = await loadPagefind();
        if (signal.aborted || root.querySelector("form")) return;

        if (import.meta.env?.DEV) {
          root.innerHTML = `
            <div class="bg-muted/75 rounded p-4 space-y-4 mb-4">
              <p><strong>DEV mode Warning! </strong>You need to build the project at least once to see the search results during development.</p>
              <code class="block bg-black text-white px-2 py-1 rounded">npm run build</code>
            </div>
          `;
        }

        const search = new PagefindUI({
          element: "#pagefind-search",
          showSubResults: true,
          showImages: false,
          processTerm(term) {
            params.set("q", term);
            history.replaceState(history.state, "", `?${params.toString()}`);
            const backUrl = root.dataset?.backurl;
            if (backUrl) {
              sessionStorage.setItem("backUrl", `${backUrl}?${params.toString()}`);
            }
            return term;
          },
        });

        activeSearch = { root, search };
        attachSearchControls(root, search, params, signal);
      } catch (error) {
        if (!signal.aborted) {
          console.error("Unable to initialize Pagefind", error);
        }
      }
    }, signal);
  });
}
