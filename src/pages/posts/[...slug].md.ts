import type { CollectionEntry } from "astro:content";
import type { APIRoute } from "astro";
import { isPostRoutable } from "@/features/blog/utils/postFilter";
import { getPostStaticPaths } from "@/features/blog/utils/postStaticPaths";
import { markdownResponse } from "../../utils/markdownResponse.ts";

export async function getStaticPaths() {
  return getPostStaticPaths(({ data }) => isPostRoutable(data));
}

export const GET: APIRoute<{ post: CollectionEntry<"blog"> }> = async ({ props }) => {
  // Read the raw markdown content
  const rawContent = props.post.body;

  return markdownResponse(rawContent);
};
