# noeflandre.com — redesign preview

A minimal preview of [noeflandre.com](https://noeflandre.com) in the new design, using the site's own navy and blue palette. Plain HTML, CSS and a little JavaScript; no build step.

## Pages

```
index.html                                         Home: About, Work, Blog, Contact, footer
posts/looking-for-my-next-career-opportunity.html  One full blog post
assets/css/style.css                               All styles (tokens at the top, breakpoints at 991px and 767px)
assets/js/main.js                                  Nav hide-on-scroll, nav colour per section, mobile menu
assets/img/                                        Illustrations, photos, mark and favicon
```

The other two posts in the Blog list link to the live site.

## Palette

| Token     | Value     | Used for                                  |
|-----------|-----------|-------------------------------------------|
| `--ink`   | `#01242e` | Page base, text on coloured bands         |
| `--sky`   | `#8cc2dd` | About band, Work accent                   |
| `--blue`  | `#4d8bf0` | Work band, About accent                   |
| `--peri`  | `#93a8f4` | Blog band, Contact accent                 |
| `--ice`   | `#c6e2ef` | Contact band, Blog accent                 |
| `--fog`   | `#c2d3db` | Text on ink                               |
| `--mist`  | `#b9cdd6` | Footer                                    |
| `--frost` | `#9ff0ff` | Closing bar                               |

`--ink` and `--sky` come straight from the current site; `--blue` is its `#3273dc`, lifted so navy text on it stays readable.

## Run locally

```sh
python3 -m http.server 8000
# open http://localhost:8000
```
