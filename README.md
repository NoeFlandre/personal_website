# noeflandre.com — redesign preview

The personal site of Noé Flandre in the new design: About, CV, Blog and Contact on one page, plus blog posts.
A small static site generator with zero dependencies builds it into `dist/`.

## Commands

```sh
npm run build    # node build.mjs: write dist/
npm run check    # exit 1 if dist/ is out of date
npm test         # unit tests + build checks (links, assets, bundle)
npm run serve    # serve dist/ on http://localhost:8000
```

Node 20 or newer. Deploy by serving `dist/` from any static host. Files under `dist/assets/` have content
hashes in their names, so they can be cached forever.

## Layout

```
build.mjs              CLI
src/content/           What the site says: site.json, home.json, cv.json, posts/**/*.md
src/templates/         Pages: layout, home, post, 404, and ui.mjs (shared pieces)
src/styles/            CSS partials, joined in name order, minified and inlined
src/scripts/           Browser modules, bundled into one deferred script
src/assets/            Fonts, illustrations, photos, icons, wordmark paths
src/build/             Generator: content, Markdown, HTML escaping, assets, bundling, feeds
tests/                 node --test
dist/                  Output (committed)
```

To write a post, add `src/content/posts/<year>/<slug>.md` with front matter (`title`, `description`, `date`,
`tags`, optional `next`). Images are referenced by name, e.g. `![Alt](fatehpur-sikri "Caption")`, and need
`src/assets/img/<name>-<width>.jpg` (plus optional `.avif` / `.webp` sizes).

## Speed

- No third-party requests. Fonts are self-hosted subsets; the "noé" wordmark is an SVG path.
- CSS is inlined; one small deferred script; illustrations are inline SVG data URIs.
- Photos ship as AVIF / WebP / JPEG with `srcset` and fixed sizes (no layout shift).
- Posts are prerendered on hover via Speculation Rules (prefetch fallback elsewhere).

## Palette

| Token     | Value     | Used for                          |
|-----------|-----------|-----------------------------------|
| `--ink`   | `#01242e` | Page base, text on coloured bands |
| `--blue`  | `#4d8bf0` | About                             |
| `--sky`   | `#8cc2dd` | CV                                |
| `--ice`   | `#c6e2ef` | Blog                              |
| `--peri`  | `#93a8f4` | Contact                           |
| `--fog`   | `#c2d3db` | Text on ink                       |
| `--mist`  | `#b9cdd6` | Footer                            |
| `--frost` | `#9ff0ff` | Closing bar                       |

## Fonts

Inter (body), Hanken Grotesk (menu) and Climate Crisis (wordmark), all under the SIL Open Font License.
See `src/assets/fonts/NOTICE.md`.
