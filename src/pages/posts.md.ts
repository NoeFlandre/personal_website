import { getCollection } from "astro:content";
import type { APIRoute } from "astro";
import { buildPostsMarkdown } from "@/features/blog/utils/markdownIndexes";

export const GET: APIRoute = async () => {
  const posts = await getCollection("blog");
  const markdownContent = buildPostsMarkdown(posts);

  return new Response(markdownContent, {
    status: 200,
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
};
