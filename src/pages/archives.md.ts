import { getCollection } from "astro:content";
import type { APIRoute } from "astro";
import { buildArchivesMarkdown } from "@/features/blog/utils/markdownIndexes";
import { markdownResponse } from "../utils/markdownResponse.ts";

export const GET: APIRoute = async () => {
  const posts = await getCollection("blog");
  const markdownContent = buildArchivesMarkdown(posts);

  return markdownResponse(markdownContent);
};
