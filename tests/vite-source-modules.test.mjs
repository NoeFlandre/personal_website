import assert from "node:assert/strict";
import test from "node:test";
import { loadSourceModule } from "./helpers/vite-source-modules.mjs";

test("loadSourceModule returns each requested source module by name", async () => {
  const { close, modules } = await loadSourceModule({ site: "/src/site-config.js" });

  try {
    assert.equal(typeof modules.site.SITE.title, "string");
  } finally {
    await close();
  }
});

test("loadSourceModule closes its Vite server and rethrows when a module fails to load", async () => {
  let closed = false;
  const closeProbe = {
    name: "close-probe",
    closeBundle() {
      closed = true;
    },
  };

  await assert.rejects(
    () => loadSourceModule({ missing: "/src/does-not-exist.ts" }, { plugins: [closeProbe] }),
    /does-not-exist/
  );
  assert.equal(closed, true);
});
