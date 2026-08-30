import assert from "node:assert/strict";
import test from "node:test";

import { groupBy } from "../src/features/blog/utils/groupBy.ts";

test("groupBy preserves first-key order and passes each item index", () => {
  const indexes = [];
  const groups = groupBy(["a", "b", "c"], (item, index) => {
    indexes.push(index);
    return item === "b" ? "middle" : "outer";
  });

  assert.deepEqual(indexes, [0, 1, 2]);
  assert.deepEqual(
    [...groups],
    [
      ["outer", ["a", "c"]],
      ["middle", ["b"]],
    ]
  );
});
