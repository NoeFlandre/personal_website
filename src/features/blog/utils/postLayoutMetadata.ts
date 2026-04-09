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

  let ogImageUrl: string | undefined;

  if (typeof initOgImage === "string") {
    ogImageUrl = initOgImage;
  } else if (initOgImage?.src) {
    ogImageUrl = initOgImage.src;
  }

  const postPath = getPath(post.id, post.filePath, true);

  if (!ogImageUrl && dynamicOgImageEnabled) {
    ogImageUrl = `${getPath(post.id, post.filePath)}/og.png?v=noeflandre-com-3`;
  }

  const ogImage = ogImageUrl ? toAbsoluteUrl(ogImageUrl, siteBase ?? currentOrigin) : undefined;
  const resolvedCanonicalURL = canonicalURL || toAbsoluteUrl(postPath, siteBase ?? currentOrigin);

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
