import { createOgFrame } from "../../src/features/blog/og/templates/frame.js";
import { scheduleAbortableTimeout } from "../../src/utils/clientLifecycle.js";
import type { normalizeYouTubeId } from "../../src/utils/youtubeEmbeds.js";

type IsAny<T> = 0 extends 1 & T ? true : false;

// An untyped JS parameter is `any`; the helper must declare a real parameter type.
export const normalizeInputIsTyped: IsAny<Parameters<typeof normalizeYouTubeId>[0]> = false;

// @ts-expect-error a number is not an OG frame child
createOgFrame(42);

scheduleAbortableTimeout({
  callback: () => {},
  clearTimeoutFn: () => {},
  // @ts-expect-error delay must be a number
  delay: "100",
  setTimeoutFn: () => 1,
  signal: new AbortController().signal,
});
