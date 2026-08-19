import { createClientLifecycle } from "../../../utils/clientLifecycle.js";
import { createPostDetailsSession } from "./postDetailsSession.js";

const lifecycle = createClientLifecycle();
let transitionHooksBound = false;

function ensureTransitionHooks(documentRef, windowRef) {
  if (transitionHooksBound) return;

  documentRef.addEventListener("astro:before-swap", () => lifecycle.cleanup());
  documentRef.addEventListener("astro:after-swap", () =>
    windowRef.scrollTo({ left: 0, top: 0, behavior: "instant" })
  );
  transitionHooksBound = true;
}

export function initPostDetails() {
  const documentRef = globalThis.document;
  const article = documentRef?.querySelector("#article");
  if (!article) {
    lifecycle.cleanup();
    return;
  }

  const windowRef = globalThis.window;
  ensureTransitionHooks(documentRef, windowRef);

  const session = createPostDetailsSession({
    documentRef,
    navigatorRef: globalThis.navigator,
    nodeFilterRef: globalThis.NodeFilter,
    windowRef,
  });

  lifecycle.activate(article, (signal) => {
    session.mount(article, signal);
  });
}
