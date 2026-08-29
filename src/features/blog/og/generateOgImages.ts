import type { CollectionEntry } from "astro:content";
import { Resvg } from "@resvg/resvg-js";
import postOgImage from "./templates/post.js";
import siteOgImage from "./templates/site.js";

const postPngCache = new Map<string, Promise<Uint8Array>>();

function svgBufferToPngBuffer(svg: string) {
  const resvg = new Resvg(svg);
  const pngData = resvg.render();
  return pngData.asPng();
}

export async function generateOgImageForPost(post: CollectionEntry<"blog">) {
  const cacheKey = `${post.id}:${JSON.stringify(post.data)}`;
  const cachedPng = postPngCache.get(cacheKey);
  if (cachedPng) return cachedPng;

  const pngPromise = postOgImage(post).then(svgBufferToPngBuffer);
  postPngCache.set(cacheKey, pngPromise);

  try {
    return await pngPromise;
  } catch (error) {
    postPngCache.delete(cacheKey);
    throw error;
  }
}

export async function generateOgImageForSite() {
  const svg = await siteOgImage();
  return svgBufferToPngBuffer(svg);
}
