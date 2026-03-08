import { type CollectionEntry, getCollection } from "astro:content";
import type { APIRoute } from "astro";
import { generateOgImageForPost } from "@/features/blog/og/generateOgImages";
import { getPath } from "@/features/blog/utils/getPath";
import { SITE } from "@/site-config.js";

export async function getStaticPaths() {
  if (!SITE.dynamicOgImage) {
    return [];
  }

  const posts = await getCollection("blog").then((p) =>
    p.filter(({ data }) => !data.draft && !data.ogImage)
  );

  return posts.map((post) => ({
    params: { slug: getPath(post.id, post.filePath, false) },
    props: post,
  }));
}

export const GET: APIRoute = async ({ props }) => {
  if (!SITE.dynamicOgImage) {
    return new Response(null, {
      status: 404,
      statusText: "Not found",
    });
  }

  const png = await generateOgImageForPost(props as CollectionEntry<"blog">);
  return new Response(new Uint8Array(png), {
    headers: { "Content-Type": "image/png" },
  });
};
