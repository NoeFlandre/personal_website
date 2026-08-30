import satori from "satori";
import loadGoogleFonts from "../../../../utils/loadGoogleFont.ts";
import { createOgFrame, createOgRenderOptions } from "./frame.js";

function createPostContent(post) {
  return [
    {
      type: "p",
      props: {
        style: {
          fontSize: 72,
          fontWeight: "bold",
          maxHeight: "84%",
          overflow: "hidden",
        },
        children: post.data.title,
      },
    },
    {
      type: "div",
      props: {
        style: {
          display: "flex",
          justifyContent: "space-between",
          width: "100%",
          marginBottom: "8px",
          fontSize: 28,
        },
        children: [
          {
            type: "span",
            props: {
              children: [
                "by ",
                {
                  type: "span",
                  props: {
                    style: { color: "transparent" },
                    children: '"',
                  },
                },
                {
                  type: "span",
                  props: {
                    style: {
                      overflow: "hidden",
                      fontWeight: "bold",
                    },
                    children: post.data.author,
                  },
                },
              ],
            },
          },
          {
            type: "span",
            props: {
              style: { overflow: "hidden", fontWeight: "bold" },
              children: "noeflandre.com",
            },
          },
        ],
      },
    },
  ];
}

export default async (post) => {
  const fonts = await loadGoogleFonts();
  return satori(createOgFrame(createPostContent(post)), createOgRenderOptions(fonts));
};
