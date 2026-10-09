import type { CollectionEntry } from "astro:content";
import { buildPostLayoutMetadata } from "../../src/features/blog/utils/postLayoutMetadata.ts";

buildPostLayoutMetadata({
  post: {
    id: "typed-post",
    filePath: "src/content/blog/typed-post.md",
    data: {
      title: "Typed Post",
      author: "Noe Flandre",
      description: "Type coverage",
      draft: false,
      unlisted: false,
      tags: ["Post"],
      pubDatetime: new Date("2025-01-01T00:00:00.000Z"),
      modDatetime: null,
    },
  },
  siteTitle: "Noe Flandre",
  siteBase: "https://example.com/",
  currentOrigin: "https://preview.local",
  dynamicOgImageEnabled: true,
});

type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type BuildPostLayoutMetadataInput = Parameters<typeof buildPostLayoutMetadata>[0];

export const postIsSchemaPick: Equal<
  BuildPostLayoutMetadataInput["post"],
  Pick<CollectionEntry<"blog">, "id" | "filePath" | "data">
> = true;
