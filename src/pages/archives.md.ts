import { getCollection } from "astro:content";
import type { APIRoute } from "astro";
import { buildArchivesMarkdown } from "@/features/blog/utils/markdownIndexes";
import { SITE } from "@/site-config.js";
import { markdownResponse } from "../utils/markdownResponse.ts";

export const GET: APIRoute = async () => {
  if (!SITE.showArchives) return new Response("Not found", { status: 404 });

  const posts = await getCollection("blog");
  const markdownContent = buildArchivesMarkdown(posts);

  return markdownResponse(markdownContent);
};
