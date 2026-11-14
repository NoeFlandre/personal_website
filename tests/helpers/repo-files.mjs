import { readFileSync } from "node:fs";
import { readFile } from "node:fs/promises";

/** URL of a file in the repository, given its path from the repository root. */
export const repoUrl = (relativePath) => new URL(`../../${relativePath}`, import.meta.url);

export const readRepoFile = (relativePath) => readFileSync(repoUrl(relativePath), "utf8");

export const readRepoFileAsync = (relativePath) => readFile(repoUrl(relativePath), "utf8");
