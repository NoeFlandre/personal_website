// The behavioral tests that Stryker runs against every source mutant. The five source
// partitions share this list, so the list lives in one place: source-mutation-tests.json.
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";

const tests = JSON.parse(
  readFileSync(new URL("./source-mutation-tests.json", import.meta.url), "utf8")
);
const result = spawnSync(process.execPath, ["--test", "--test-concurrency=1", ...tests], {
  stdio: "inherit",
});
process.exit(result.status ?? 1);
