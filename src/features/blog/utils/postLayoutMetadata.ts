import { toAbsoluteUrl } from "../../../utils/url.ts";
import { getPath } from "./getPath.ts";

type PostLike = {
  id: string;
  filePath?: string;
  data: {
    title: string;
    author?: string;
    description?: string;
    ogImage?: string | { src?: string };
    canonicalURL?: string;
    pubDatetime?: Date;
    modDatetime?: Date | null;
  };
};

type BuildPostLayoutMetadataInput = {
  post: PostLike;
  siteTitle: string;
  siteBase?: string | URL;
  currentOrigin: string | URL;
  dynamicOgImageEnabled: boolean;
};

function resolveOgImagePath(
  initialOgImage: PostLike["data"]["ogImage"],
  post: PostLike,
  dynamicOgImageEnabled: boolean
) {
  if (typeof initialOgImage === "string") return initialOgImage;
  if (initialOgImage?.src) return initialOgImage.src;
  if (!dynamicOgImageEnabled) return undefined;
  return `${getPath(post.id, post.filePath)}/og.png?v=noeflandre-com-3`;
}

export function buildPostLayoutMetadata({
  post,
  siteTitle,
  siteBase,
  currentOrigin,
  dynamicOgImageEnabled,
}: BuildPostLayoutMetadataInput) {
  const {
    title,
    author,
    description,
    ogImage: initOgImage,
    canonicalURL,
    pubDatetime,
    modDatetime,
  } = post.data;

  const postPath = getPath(post.id, post.filePath, true);
  const baseUrl = siteBase ?? currentOrigin;
  const ogImagePath = resolveOgImagePath(initOgImage, post, dynamicOgImageEnabled);
  const ogImage = ogImagePath ? toAbsoluteUrl(ogImagePath, baseUrl) : undefined;
  const resolvedCanonicalURL = canonicalURL || toAbsoluteUrl(postPath, baseUrl);

  return {
    postPath,
    canonicalURL: resolvedCanonicalURL,
    ogImage,
    layoutProps: {
      title: `${title} | ${siteTitle}`,
      author,
      description,
      pubDatetime,
      modDatetime,
      canonicalURL: resolvedCanonicalURL,
      ogImage,
      scrollSmooth: true,
    },
  };
}
