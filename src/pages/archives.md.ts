import { getCollection } from "astro:content";
import type { APIRoute } from "astro";
import { buildArchivesMarkdown } from "@/features/blog/utils/markdownIndexes";

export const GET: APIRoute = async () => {
  const posts = await getCollection("blog");
  const markdownContent = buildArchivesMarkdown(posts);

  return new Response(markdownContent, {
    status: 200,
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
};
