import assert from "node:assert/strict";
import test from "node:test";

import { onRequest } from "../src/middleware.js";

function createContext(pathname) {
  const redirects = [];
  return {
    context: {
      request: new Request(`https://example.test${pathname}`),
      redirect(location, status) {
        redirects.push({ location, status });
        return { location, status };
      },
    },
    redirects,
  };
}

test("redirects legacy blog post URLs to the posts route", async () => {
  const { context, redirects } = createContext("/blog/attention-pooling");

  const response = await onRequest(context, () => {
    throw new Error("legacy blog URLs should not call next");
  });

  assert.deepEqual(response, { location: "/posts/attention-pooling", status: 301 });
  assert.deepEqual(redirects, [{ location: "/posts/attention-pooling", status: 301 }]);
});

test("redirects both legacy blog index spellings", async () => {
  for (const pathname of ["/blog", "/blog/"]) {
    const { context, redirects } = createContext(pathname);

    await onRequest(context, () => {
      throw new Error("legacy blog indexes should not call next");
    });

    assert.deepEqual(redirects, [{ location: "/posts/", status: 301 }]);
  }
});

test("passes non-blog requests to the next handler", async () => {
  const { context, redirects } = createContext("/posts");
  let nextCalls = 0;

  const response = await onRequest(context, () => {
    nextCalls += 1;
    return "next response";
  });

  assert.equal(response, "next response");
  assert.equal(nextCalls, 1);
  assert.deepEqual(redirects, []);
});
