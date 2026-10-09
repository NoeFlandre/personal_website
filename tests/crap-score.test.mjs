import assert from "node:assert/strict";
import test from "node:test";
import { checkCrapReport } from "../scripts/check-crap-score.mjs";

function reportWithScores(scores) {
  return {
    "src/example.js": Object.fromEntries(
      scores.map((score, index) => [`function${index + 1}`, { statements: { crap: score } }])
    ),
  };
}

test("CRAP report check returns its function count and maximum score", () => {
  assert.deepEqual(checkCrapReport(reportWithScores([2, 4]), 6), {
    functionCount: 2,
    maxCrap: 4,
  });
});

test("CRAP report check rejects a score at the configured threshold", () => {
  assert.throws(
    () => checkCrapReport(reportWithScores([2, 6]), 6),
    /CRAP threshold 6 was exceeded by src\/example\.js:function2 \(6\)/
  );
});

test("CRAP report check rejects reports without measurable functions", () => {
  assert.throws(() => checkCrapReport({}, 6), /contains no measurable functions/);
});

test("CRAP report check rejects a non-numeric threshold", () => {
  assert.throws(
    () => checkCrapReport(reportWithScores([2]), Number("six")),
    /CRAP threshold must be a finite number/
  );
});

test("CRAP report check rejects a function without a numeric crap score", () => {
  const report = {
    "src/example.js": {
      function1: { statements: { crap: 2 } },
      function2: { statements: {} },
    },
  };
  assert.throws(
    () => checkCrapReport(report, 6),
    /src\/example\.js:function2 has no numeric statements\.crap/
  );
});

test("CRAP report check rejects a crap score that is not a number", () => {
  const report = {
    "src/example.js": {
      function1: { statements: { crap: 2 } },
      function2: { statements: { crap: "7" } },
    },
  };
  assert.throws(
    () => checkCrapReport(report, 6),
    /src\/example\.js:function2 has no numeric statements\.crap/
  );
});
