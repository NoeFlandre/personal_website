# Lorem Ipsum — website template

A static, single-page site with three legal pages. Plain HTML, CSS and a little JavaScript; no build step.

All text is placeholder copy and all illustrations are original stand-ins. Swap them for your own content.

## Structure

```
index.html                 Home: Mission, Beliefs, Blog, Careers, footer
privacy-policy.html        Legal page template
terms-and-conditions.html  Legal page template
cookie-policy.html         Legal page template
assets/css/style.css       All styles (tokens at the top, breakpoints at 991px and 767px)
assets/js/main.js          Nav hide-on-scroll, nav colour per section, mobile menu
assets/img/                SVG illustrations, mark and favicon
```

## Run locally

```sh
python3 -m http.server 8000
# open http://localhost:8000
```

## Deploy

Works as-is on GitHub Pages, Netlify, Vercel or any static host.

## Customise

- Colours and fonts: the `:root` tokens at the top of `assets/css/style.css`.
- Nav colour per section: the `data-color` attribute on each `[data-chapter]` wrapper in `index.html`.
- Wordmark: the inline `<svg><text>` in the nav and footer.
