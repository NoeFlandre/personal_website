# Post Filter UX Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the blog filter controls behave as one predictable toggle group across the all-posts and tag pages.

**Architecture:** Keep filtering server-rendered and URL-based. A feature-local `PostFilterBar.astro` component will render one shared control bar, while a pure `getPostFilterOptions` utility will own active-state and destination rules. The all-posts page and tag pages will supply the same dynamic tag list, preserving normal links, pagination, and SEO.

**Tech Stack:** Astro 5, TypeScript, Astro content collections, Node test runner, Biome, and the existing static build.

---

## File map

- Create `src/features/blog/utils/getPostFilterOptions.ts` — pure route and active-state mapping for the filter controls.
- Create `src/features/blog/components/PostFilterBar.astro` — shared accessible filter-bar markup and styling.
- Modify `src/pages/posts/index.astro` — supply dynamic tags and render the shared bar without an active tag.
- Modify `src/pages/tags/[tag]/[...page].astro` — render the shared bar with the current tag active.
- Create `tests/post-filter.test.mjs` — route-matrix and component-integration regression tests.
- Create `docs/superpowers/specs/2026-08-17-post-filter-ux-design.md` — approved design already committed as `a1ec6bb`.

### Task 1: Establish the failing route and integration tests

**Files:**
- Create: `tests/post-filter.test.mjs`

- [ ] **Step 1: Run the current baseline test suite**

Run:

```bash
npm test
```

Expected: the existing suite passes with 99 tests before this feature’s tests are added.

- [ ] **Step 2: Write the failing tests**

Create `tests/post-filter.test.mjs` with these assertions:

```js
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const rootUrl = (path) => new URL(`../${path}`, import.meta.url);
const read = (path) => readFileSync(rootUrl(path), "utf8");

async function loadPostFilterOptions() {
  try {
    return (await import("../src/features/blog/utils/getPostFilterOptions.ts"))
      .getPostFilterOptions;
  } catch {
    assert.fail("getPostFilterOptions should exist");
  }
}

test("post filter options mark All Posts active and link tags", async () => {
  const getPostFilterOptions = await loadPostFilterOptions();

  const tags = [
    { tag: "paper-review", tagName: "Paper Review" },
    { tag: "post", tagName: "Post" },
  ];

  assert.deepEqual(getPostFilterOptions(tags), [
    { label: "All Posts", href: "#main-content", active: true },
    { label: "Paper Review", href: "/tags/paper-review", active: false },
    { label: "Post", href: "/tags/post", active: false },
  ]);
});

test("the active tag toggles back to All Posts", async () => {
  const getPostFilterOptions = await loadPostFilterOptions();
  const tags = [
    { tag: "paper-review", tagName: "Paper Review" },
    { tag: "post", tagName: "Post" },
  ];

  assert.deepEqual(getPostFilterOptions(tags, "post"), [
    { label: "All Posts", href: "/posts", active: false },
    { label: "Paper Review", href: "/tags/paper-review", active: false },
    { label: "Post", href: "/posts", active: true },
  ]);
});

test("both pages use one accessible shared filter bar", () => {
  const componentPath = rootUrl("src/features/blog/components/PostFilterBar.astro");
  assert.equal(existsSync(componentPath), true, "PostFilterBar.astro should exist");

  const component = read("src/features/blog/components/PostFilterBar.astro");
  const postsPage = read("src/pages/posts/index.astro");
  const tagPage = read("src/pages/tags/[tag]/[...page].astro");

  assert.match(component, /aria-label="Post filters"/);
  assert.match(component, /aria-current/);
  assert.match(component, /getPostFilterOptions/);
  assert.match(postsPage, /<PostFilterBar\s+tags=\{[^}]+\}/);
  assert.match(tagPage, /<PostFilterBar\s+tags=\{[^}]+\}\s+activeTag=\{tag\}/);
});
```

- [ ] **Step 3: Run the new tests and confirm RED**

Run:

```bash
node --test tests/post-filter.test.mjs
```

Expected: fail because the new utility and shared component do not exist yet. The first test must report the explicit `getPostFilterOptions should exist` assertion, not an unrelated syntax or test-runner error.

### Task 2: Implement the pure filter-option mapping and shared component

**Files:**
- Create: `src/features/blog/utils/getPostFilterOptions.ts`
- Create: `src/features/blog/components/PostFilterBar.astro`
- Test: `tests/post-filter.test.mjs`

- [ ] **Step 1: Add the pure route mapper**

Create `src/features/blog/utils/getPostFilterOptions.ts`:

```ts
import type { TagInfo } from "./tags.ts";
import { getTagPath } from "./tags.ts";

export interface PostFilterOption {
  label: string;
  href: string;
  active: boolean;
}

export function getPostFilterOptions(
  tags: TagInfo[],
  activeTag?: string
): PostFilterOption[] {
  const currentTag = activeTag?.trim() || undefined;

  return [
    {
      label: "All Posts",
      href: currentTag ? "/posts" : "#main-content",
      active: currentTag === undefined,
    },
    ...tags.map(({ tag, tagName }) => ({
      label: tagName,
      href: tag === currentTag ? "/posts" : getTagPath(tagName),
      active: tag === currentTag,
    })),
  ];
}
```

- [ ] **Step 2: Add the shared accessible filter bar**

Create `src/features/blog/components/PostFilterBar.astro`:

```astro
---
import type { TagInfo } from "@/features/blog/utils/tags";
import { getPostFilterOptions } from "@/features/blog/utils/getPostFilterOptions";

interface Props {
  tags: TagInfo[];
  activeTag?: string;
}

const { tags, activeTag } = Astro.props;
const options = getPostFilterOptions(tags, activeTag);
---

<nav aria-label="Post filters" class="mb-6 flex flex-wrap items-center gap-2">
  <span class="text-sm font-semibold text-foreground/70">Filter:</span>
  {options.map((option) => (
    <a
      href={option.href}
      aria-current={option.active ? "page" : undefined}
      class:list={[
        "rounded-full border px-3 py-1 text-sm transition-colors hover:border-accent/60 hover:text-accent",
        option.active ? "border-accent bg-accent text-background" : "border-border",
      ]}
    >
      {option.label}
    </a>
  ))}
</nav>
```

- [ ] **Step 3: Run the focused tests and confirm GREEN**

Run:

```bash
node --test tests/post-filter.test.mjs
```

Expected: all three tests pass. The first two prove the route matrix; the third proves the shared component exposes the active state and both pages use it.

### Task 3: Integrate the shared bar into both page types

**Files:**
- Modify: `src/pages/posts/index.astro`
- Modify: `src/pages/tags/[tag]/[...page].astro`
- Test: `tests/post-filter.test.mjs`

- [ ] **Step 1: Replace the posts-page hard-coded controls**

In `src/pages/posts/index.astro`:

```astro
import PostFilterBar from "@/features/blog/components/PostFilterBar.astro";
import getUniqueTags from "@/features/blog/utils/getUniqueTags";
```

After loading `posts`, derive the shared list:

```astro
const filterTags = getUniqueTags(posts);
```

Replace the existing `Filter:` block and its three hard-coded links with:

```astro
<PostFilterBar tags={filterTags} />
```

- [ ] **Step 2: Replace the tag-page duplicated controls**

In `src/pages/tags/[tag]/[...page].astro`, import `PostFilterBar`, remove the direct `getTagPath` import, and rename the page-level `switchableTags` value to `filterTags`:

```astro
import PostFilterBar from "@/features/blog/components/PostFilterBar.astro";

const filterTags = getUniqueTags(posts);
```

Replace the existing `Switch filter:` block with:

```astro
<PostFilterBar tags={filterTags} activeTag={tag} />
```

Keep `getTagPath` available in `getStaticPaths` only through the shared utility; do not reintroduce page-local route construction.

- [ ] **Step 3: Run the focused tests again**

Run:

```bash
node --test tests/post-filter.test.mjs tests/blog-feature-structure.test.mjs
```

Expected: all focused filter and blog-structure tests pass, with no same-route active tag link remaining in the page sources.

### Task 4: Run the complete verification gate and manually exercise the UX

**Files:**
- Verify: `src/features/blog/components/PostFilterBar.astro`
- Verify: `src/features/blog/utils/getPostFilterOptions.ts`
- Verify: `src/pages/posts/index.astro`
- Verify: `src/pages/tags/[tag]/[...page].astro`

- [ ] **Step 1: Run the complete automated gate**

Run:

```bash
npm test
npm run check
npm run lint
npm run astro -- check
npm run build:check
```

Expected: 102 tests pass, Biome check and lint report no issues, Astro reports zero diagnostics, and the static build completes successfully without a new dependency.

- [ ] **Step 2: Manually verify the route matrix in the built site**

Use the existing project preview/browser workflow against the built output and verify:

1. `/posts` shows `All Posts` highlighted and every available tag as an inactive option.
2. Clicking `Post` navigates to `/tags/post`, where `Post` is highlighted.
3. Clicking the highlighted `Post` navigates back to `/posts`.
4. Clicking another tag from `/tags/post` opens that tag page with the new tag highlighted.
5. Clicking active `All Posts` on `/posts` changes the URL to `#main-content` and moves the viewport to the top without a full reload.
6. Keyboard Tab focus is visible on every filter control, and the active option exposes `aria-current="page"`.
7. Tag pagination still links to the correct next page after switching filters.

- [ ] **Step 3: Review the final diff and commit the implementation**

Run:

```bash
git diff --check
git status --short --branch
git diff --stat HEAD~1..HEAD
```

Stage only the filter implementation, its tests, and the already-reviewed spec/plan documents. Leave `.gitignore`, `output/`, and all existing posts/assets outside the commit. Commit with:

```bash
git commit -m "fix: make post filters toggleable"
```

- [ ] **Step 4: Push and verify the remote**

Run:

```bash
git push origin main
git rev-parse HEAD origin/main
git ls-remote origin refs/heads/main
```

Expected: local `HEAD`, `origin/main`, and the live remote `main` ref resolve to the same commit, with unrelated work still present locally and uncommitted.
