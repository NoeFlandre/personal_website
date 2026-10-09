import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("FormattedDate formats dates in the site timezone, not the build machine timezone", () => {
  const formattedDate = readFileSync(
    new URL("../src/components/FormattedDate.astro", import.meta.url),
    "utf8"
  );

  assert.match(formattedDate, /import\s*\{\s*SITE\s*\}\s*from\s*"@\/site-config\.js";/);
  assert.match(formattedDate, /timeZone:\s*SITE\.timezone/);
});
