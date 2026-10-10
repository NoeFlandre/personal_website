import assert from "node:assert/strict";
import test from "node:test";
import { loadSourceModule } from "./helpers/vite-source-modules.mjs";

async function loadPostFilter(nodeEnv) {
  const { close, modules } = await loadSourceModule(
    { postFilter: "/src/features/blog/utils/postFilter.ts" },
    { nodeEnv }
  );

  return { module: modules.postFilter, close };
}

const futurePost = {
  pubDatetime: "2099-01-01T00:00:00.000Z",
  draft: false,
  unlisted: false,
  tags: ["Post"],
};

test("post visibility uses the development environment default when no option is supplied", async () => {
  const { close, module } = await loadPostFilter("development");

  try {
    assert.equal(module.isPostVisible(futurePost), true);
  } finally {
    await close();
  }
});

test("post visibility hides future posts in production when no option is supplied", async () => {
  const { close, module } = await loadPostFilter("production");

  try {
    assert.equal(module.isPostVisible(futurePost), false);
  } finally {
    await close();
  }
});
