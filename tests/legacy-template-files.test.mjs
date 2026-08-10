import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import test from "node:test";

const legacyFiles = [
  "src/layouts/BaseLayout.astro",
  "src/layouts/BlogPost.astro",
  "src/components/BaseHead.astro",
  "src/components/Sidebar.astro",
  "src/components/Breadcrumb.astro",
  "src/components/HeaderLink.astro",
  "src/components/Link.astro",
  "src/components/NewsletterForm.astro",
  "src/components/SocialIcons.astro",
];

test("legacy template files stay removed after the layout migration", () => {
  for (const path of legacyFiles) {
    assert.equal(
      existsSync(new URL(`../${path}`, import.meta.url)),
      false,
      `${path} should not be reintroduced without an active caller`
    );
  }
});
