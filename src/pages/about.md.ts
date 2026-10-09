import type { APIRoute } from "astro";
import { readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { markdownResponse } from "../utils/markdownResponse.ts";

// Resolved from this module, not process.cwd(). The build emits this route into
// dist/pages/, as deep as src/pages/, so the same relative path works in both.
const currentDir = path.dirname(fileURLToPath(import.meta.url));
const aboutSourcePath = path.resolve(currentDir, "../../src/pages/about.mdx");

export function createAboutMarkdownResponse(
  readSource = () => readFileSync(aboutSourcePath, "utf-8")
) {
  let rawContent: unknown;
  try {
    rawContent = readSource();
  } catch (error) {
    console.error("Failed to read about markdown source:", error);
    return new Response("Not found", { status: 404 });
  }

  if (typeof rawContent !== "string") {
    console.error("About markdown source is not a string:", typeof rawContent);
    return new Response("Not found", { status: 404 });
  }

  return markdownResponse(rawContent);
}

export const GET: APIRoute = async () => createAboutMarkdownResponse();
