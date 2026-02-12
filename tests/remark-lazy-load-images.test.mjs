import test from "node:test";
import assert from "node:assert/strict";

import { remarkLazyLoadImages } from "../src/utils/remarkLazyLoadImages.mjs";

test("remarkLazyLoadImages marks markdown images as loading=lazy", () => {
  const tree = {
    type: "root",
    children: [
      {
        type: "paragraph",
        children: [
          {
            type: "image",
            url: "/hero.png",
            alt: "hero",
          },
        ],
      },
    ],
  };

  const transform = remarkLazyLoadImages();
  transform(tree);

  const imageNode = tree.children[0].children[0];
  assert.equal(imageNode.data.hProperties.loading, "lazy");
});

test("remarkLazyLoadImages preserves existing image hProperties", () => {
  const tree = {
    type: "root",
    children: [
      {
        type: "image",
        url: "/avatar.png",
        alt: "avatar",
        data: {
          hProperties: {
            decoding: "async",
          },
        },
      },
    ],
  };

  const transform = remarkLazyLoadImages();
  transform(tree);

  const imageNode = tree.children[0];
  assert.equal(imageNode.data.hProperties.loading, "lazy");
  assert.equal(imageNode.data.hProperties.decoding, "async");
});
