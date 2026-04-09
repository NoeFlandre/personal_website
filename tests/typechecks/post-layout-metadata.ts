import { buildPostLayoutMetadata } from "../../src/features/blog/utils/postLayoutMetadata.ts";

buildPostLayoutMetadata({
  post: {
    id: "typed-post",
    filePath: "src/content/blog/typed-post.md",
    data: {
      title: "Typed Post",
      description: "Type coverage",
      pubDatetime: new Date("2025-01-01T00:00:00.000Z"),
      modDatetime: null,
    },
  },
  siteTitle: "Noe Flandre",
  siteBase: "https://example.com/",
  currentOrigin: "https://preview.local",
  dynamicOgImageEnabled: true,
});
