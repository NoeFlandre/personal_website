# noeflandre.com — redesign preview

The personal site of Noé Flandre in the new design: About, CV, Blog and Contact on one page, plus every blog
post of the old site at its old URL. A small static site generator builds it into `dist/`. Its only
dependencies, `marked` (Markdown) and `katex` (maths), run at build time; readers download neither.

## Commands

```sh
npm ci           # install marked and katex
npm run build    # node build.mjs: write dist/
npm test         # unit tests + build checks (old URLs, links, assets, maths, bundle)
npm run serve    # serve dist/ on http://localhost:8000
npm run art      # redraw the pixel-art illustrations (scripts/pixel-art.mjs)
```

Node 20 or newer. `vercel.json` deploys it on Vercel: build, no trailing slashes (as before), the old
redirects, long caching for hashed assets and security headers. Any static host serving `dist/` works too.

## URLs kept from the old site

- Posts: `/posts/<file path>` without a trailing slash, e.g. `/posts/2026/attention-pooling`. A test checks
  all 23 old post URLs.
- `/posts`, `/tags`, `/tags/<tag>`, `/rss.xml`, `/about` (sends to `/#about`), `/assets/docs/noe-flandre-cv.pdf`,
  `/noe-avatar.jpg`.
- `/sw.js` replaces the old site's service worker with one that removes itself, so returning visitors do not
  see cached old pages.

## Layout

```
build.mjs              CLI
src/content/           What the site says: site.json, home.json, cv.json, posts/**/*.md
src/templates/         Pages: layout, home, post, post lists, 404, and ui.mjs (shared pieces)
src/styles/            CSS partials, joined in name order, minified and inlined
src/scripts/           Browser modules, bundled into one deferred script
src/assets/            Fonts, illustrations, photos, icons, wordmark paths (fingerprinted when published)
src/static/            Files published as is, at fixed URLs (CV, avatar, favicon.ico, sw.js)
src/build/             Generator: content, Markdown, maths, HTML escaping, assets, bundling, feeds
scripts/pixel-art.mjs  The pixel-art characters (sprites as character maps) -> src/assets/img/*.svg
tests/                 node --test
dist/                  Output (not committed)
```

To write a post, add `src/content/posts/2026/<slug>.md`; it is published at `/posts/2026/<slug>`. Front matter:
`title`, `description`, `date` (ISO), `tags` (e.g. `[Post]`), optional `hero`, `heroAlt`, `heroCaption`.

Markdown is GitHub-flavoured, plus `$maths$`, `$$display maths$$` and `{% youtube <url> %}`. Images are named
relative to the post: `![Alt](diagram#480 "Figure 1: caption")` uses `src/assets/img/posts/<post path>/diagram.svg`
or `diagram-<width>.<avif|webp|jpg|png>`; `#480` caps its width at 480px.

## Speed

- No third-party requests (bar YouTube thumbnails on video posts). Fonts are self-hosted subsets; the "noé" wordmark is an SVG path.
- CSS is inlined; one small deferred script; illustrations are inline SVG data URIs.
- Photos ship as AVIF / WebP / JPEG with `srcset` and fixed sizes (no layout shift).
- Posts are prerendered on hover via Speculation Rules (prefetch fallback elsewhere).
- Maths is HTML at build time; only pages with maths load KaTeX's stylesheet and fonts.
- YouTube videos load the player only when clicked.

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
See `src/assets/fonts/NOTICE.md`. KaTeX's fonts come from the `katex` package (MIT).
