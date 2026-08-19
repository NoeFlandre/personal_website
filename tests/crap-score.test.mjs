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
