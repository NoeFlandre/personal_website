import type { CollectionEntry } from "astro:content";
import { getCollection } from "astro:content";
import type { APIRoute } from "astro";
import { isPostRoutable } from "@/features/blog/utils/postFilter";
import { getPostStaticPathParams } from "@/features/blog/utils/staticPaths";
import { markdownResponse } from "../../utils/markdownResponse.ts";

export async function getStaticPaths() {
  const posts = await getCollection("blog", ({ data }) => isPostRoutable(data));

  return posts.map((post) => ({
    params: getPostStaticPathParams(post),
    props: { post },
  }));
}

export const GET: APIRoute = async ({ props }) => {
  const { post } = props as { post: CollectionEntry<"blog"> };

  // Read the raw markdown content
  const rawContent = post.body;
  if (typeof rawContent !== "string") {
    console.error("Post markdown body is not a string:", post.id);
    return new Response("Not found", { status: 404 });
  }

  return markdownResponse(rawContent);
};
