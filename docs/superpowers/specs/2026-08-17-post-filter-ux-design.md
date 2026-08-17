# Post Filter UX Redesign

## Status

Approved for specification review; implementation has not started.

## Context

The posts page and tag pages currently render separate filter controls. Each
control is a plain link, so clicking the already-selected tag navigates to the
same URL and appears to do nothing. The posts page also does not visually mark
`All Posts` as the active view, and the two pages can drift because their filter
markup is duplicated.

## Goals

- Make the filter choices behave like one clear toggle group.
- Let clicking the active tag remove that filter and return to `/posts`.
- Make `All Posts` visibly active on `/posts`.
- Give the active `All Posts` control a useful action by returning the view to
  the top without reloading the same route.
- Keep tag pages, pagination, shareable URLs, server rendering, and SEO
  behavior intact.
- Keep the control keyboard accessible and expose the active choice through
  `aria-current`.

## Non-goals

- Replacing server-rendered tag pages with client-side card filtering.
- Changing tag names, tag URLs, post ordering, pagination, or post content.
- Adding a new search or filtering dependency.

## Design

### Shared filter component

Add one feature-local `PostFilterBar.astro` component under
`src/features/blog/components/`. It receives the available `TagInfo` values
and the optional active tag slug. Both the all-posts page and tag pages use
this component, so labels, links, active styling, and accessibility behavior
live in one place.

The available tags come from `getUniqueTags(posts)` on both pages instead of
maintaining a second hard-coded list on the posts page.

### Link behavior

| Current view | Control | Result |
| --- | --- | --- |
| `/posts` | `All Posts` | Active reset link to `#main-content`; returns to the top without reloading |
| `/posts` | A tag | Navigate to `/tags/<tag>` |
| `/tags/<tag>` | `All Posts` | Navigate to `/posts` |
| `/tags/<tag>` | The active tag | Navigate to `/posts`, removing the filter |
| `/tags/<tag>` | Another tag | Navigate to that tag page |

The active choice receives the existing accent treatment plus
`aria-current="page"`. Inactive choices retain the existing border, hover,
and focus-visible styles.

### Layout and navigation

The filter bar keeps the current wrapping flex layout and copy, but uses the
same component and classes on both page types. No client-side filtering state
is introduced. Normal links continue to work without JavaScript and preserve
the existing Astro page-transition behavior.

## Testing and verification

- Add structural tests for the shared filter component and both page call
  sites.
- Test the route matrix above, including active-tag toggling to `/posts` and
  the active `All Posts` reset target.
- Run the existing unit suite, Biome checks, lint, Astro diagnostics, and the
  production build.
- Manually exercise `/posts`, `/tags/post`, and another tag page at desktop
  and mobile widths, including keyboard focus and the active-control actions.

## Acceptance criteria

- Clicking `Post` while viewing `/tags/post` returns to `/posts`.
- `All Posts` is visibly and semantically active on `/posts`.
- Clicking active `All Posts` moves the page to the top without a same-route
  reload.
- Switching between tags still opens the correct tag page and keeps
  pagination working.
- No unrelated content, URL, dependency, or styling behavior changes.
