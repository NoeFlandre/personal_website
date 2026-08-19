import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

export function checkCrapReport(report, maxCrap) {
  const scores = Object.entries(report).flatMap(([file, functions]) =>
    Object.entries(functions).flatMap(([functionName, details]) => {
      const crap = details?.statements?.crap;
      return typeof crap === "number" ? [{ file, functionName, crap }] : [];
    })
  );

  if (scores.length === 0) {
    throw new Error("CRAP report contains no measurable functions");
  }

  const violations = scores.filter(({ crap }) => crap >= maxCrap);
  if (violations.length > 0) {
    const details = violations
      .map(({ file, functionName, crap }) => `${file}:${functionName} (${crap})`)
      .join(", ");
    throw new Error(`CRAP threshold ${maxCrap} was exceeded by ${details}`);
  }

  return {
    functionCount: scores.length,
    maxCrap: Math.max(...scores.map(({ crap }) => crap)),
  };
}

function main() {
  const reportPath = process.argv[2] ?? "crap-report/crap-report.json";
  const maxCrap = Number(process.argv[3] ?? 6);
  const report = JSON.parse(readFileSync(reportPath, "utf8"));
  const summary = checkCrapReport(report, maxCrap);

  console.log(
    `[crap] ${summary.functionCount} functions checked; maximum CRAP ${summary.maxCrap}; threshold < ${maxCrap}`
  );
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
