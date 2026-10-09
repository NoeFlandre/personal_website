import type { CollectionEntry } from "astro:content";
import type { APIRoute } from "astro";
import { generateOgImageForPost } from "@/features/blog/og/generateOgImages";
import { shouldGenerateDynamicOgImage } from "@/features/blog/utils/ogImages";
import { getPostStaticPaths } from "@/features/blog/utils/postStaticPaths";
import { SITE } from "@/site-config.js";

export async function getStaticPaths() {
  if (!SITE.dynamicOgImage) {
    return [];
  }

  return getPostStaticPaths(shouldGenerateDynamicOgImage);
}

export const GET: APIRoute<{ post: CollectionEntry<"blog"> }> = async ({ props }) => {
  if (!SITE.dynamicOgImage) {
    return new Response(null, {
      status: 404,
      statusText: "Not found",
    });
  }

  const png = await generateOgImageForPost(props.post);
  return new Response(new Uint8Array(png), {
    headers: { "Content-Type": "image/png" },
  });
};
