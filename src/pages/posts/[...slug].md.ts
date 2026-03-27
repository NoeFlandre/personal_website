import type { CollectionEntry } from "astro:content";
import { getCollection } from "astro:content";
import type { APIRoute } from "astro";
import { isDraftFreePost } from "@/features/blog/utils/postFilter";
import { getPostStaticPathParams } from "@/features/blog/utils/staticPaths";

export async function getStaticPaths() {
  const posts = await getCollection("blog", ({ data }) => isDraftFreePost(data));

  return posts.map((post) => ({
    params: getPostStaticPathParams(post),
    props: { post },
  }));
}

export const GET: APIRoute = async ({ props }) => {
  const { post } = props as { post: CollectionEntry<"blog"> };

  // Read the raw markdown content
  const rawContent = post.body;

  // Return the markdown content with proper headers
  return new Response(rawContent, {
    status: 200,
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
};
