import {
  createAstroTransitionHooks,
  createClientLifecycle,
} from "../../../utils/clientLifecycle.js";
import { createPostDetailsSession } from "./postDetailsSession.js";

const lifecycle = createClientLifecycle();
const transitionHooks = createAstroTransitionHooks();

export function initPostDetails() {
  const documentRef = globalThis.document;
  const article = documentRef?.querySelector("#article");
  if (!article) {
    lifecycle.cleanup();
    return;
  }

  const windowRef = globalThis.window;
  transitionHooks.ensure(documentRef, {
    onBeforeSwap: () => lifecycle.cleanup(),
    onAfterSwap: () => windowRef.scrollTo({ left: 0, top: 0, behavior: "instant" }),
  });

  const session = createPostDetailsSession();

  lifecycle.activate(article, (signal) => {
    session.mount(article, signal);
  });
}
