import type { APIRoute } from "astro";
import { readFileSync } from "fs";
import { join } from "path";

export function createAboutMarkdownResponse(
  readSource = () => readFileSync(join(process.cwd(), "src/pages/about.mdx"), "utf-8")
) {
  try {
    const rawContent = readSource();
    if (typeof rawContent !== "string") {
      throw new TypeError();
    }

    // Return the markdown content with proper headers
    return new Response(rawContent, {
      status: 200,
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}

export const GET: APIRoute = async () => createAboutMarkdownResponse();
