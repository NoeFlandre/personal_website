# Testing and risk checks

The site uses Node's built-in test runner for unit and regression tests. Use Node 22.18 or
newer: the tests import TypeScript directly using [native type stripping](https://nodejs.org/docs/latest-v22.x/api/typescript.html#type-stripping).

```sh
npm test
```

Tests live in `tests/`, grouped by the part of the site they cover:

| Folder | Covers |
| --- | --- |
| `about/` | About page: career timeline, travel map, testimonials, profile links |
| `blog/` | Blog features: listings, filters, post pages, feeds, Open Graph images, embeds |
| `content/` | The content collection and checks pinned to individual posts |
| `site/` | Site-wide code: config, layouts, styles, routes, URL and image helpers |
| `tooling/` | CI, quality scripts, and the test helpers themselves |
| `writer/` | The local post writer in `scripts/write/` |
| `e2e/` | Playwright browser tests (`npm run test:e2e`) |
| `helpers/` | Shared fixtures and fakes; `repo-files.mjs` resolves paths from the repository root |
| `typechecks/` | TypeScript-only checks run by `blog/post-layout-metadata-types.test.mjs` |

Coverage is collected for the source tree and written to `coverage/c8/`:

```sh
npm run test:coverage
```

The thresholds in `.c8rc.json` are the coverage floor; the command fails when coverage drops below them.

Mutation testing runs deliberately changed versions of the JavaScript and TypeScript source files.
The command audits the main source tree, route adapters, Open Graph generation, and the content
schema in separate Stryker scopes. Each scope has a behavioral test suite and requires every
generated mutant to be killed; results are printed in the terminal. The regular suite also contains
source-inspection tests, which cannot run against Stryker's instrumented sandbox copies. The
report-heavy HTML and JSON reporters are intentionally disabled to keep the full local run bounded:

```sh
npm run test:mutation
```

The five source scopes share one test list, `scripts/source-mutation-tests.json`, which
`scripts/run-source-mutation-tests.mjs` runs. Add a behavioral test there when it imports a
mutated module; the quality checks fail otherwise.

The CRAP score combines cyclomatic complexity and statement coverage:

```text
CRAP = complexity² × (1 - coverage)³ + complexity
```

It estimates which functions are riskiest to change. The report is generated from the coverage
artifact and written to `crap-report/`:

```sh
npm run test:crap
```

Run the complete local quality pass with:

```sh
npm run test:quality
```
