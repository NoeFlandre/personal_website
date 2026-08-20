# Testing and risk checks

The site uses Node's built-in test runner for unit and regression tests.

```sh
npm test
```

Coverage is collected for the source tree and written to `coverage/c8/`:

```sh
npm run test:coverage
```

Mutation testing runs deliberately changed versions of the JavaScript and TypeScript source files.
The command audits the main source tree, route adapters, Open Graph generation, and the content
schema in separate Stryker scopes. Each scope has a behavioral test suite and requires every
generated mutant to be killed; results are printed in the terminal. The regular suite also contains
source-inspection tests, which cannot run against Stryker's instrumented sandbox copies. The
report-heavy HTML and JSON reporters are intentionally disabled to keep the full local run bounded:

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
