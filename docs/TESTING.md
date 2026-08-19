# Testing and risk checks

The site uses Node's built-in test runner for unit and regression tests.

```sh
npm test
```

Coverage is collected for the pure About and blog utilities and written to `coverage/c8/`:

```sh
npm run test:coverage
```

Mutation testing runs deliberately changed versions of the About-map and adjacent-post utilities.
It checks whether the focused tests detect those changes and writes an HTML and JSON report under
`coverage/mutation/`:

```sh
npm run test:mutation
```

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
