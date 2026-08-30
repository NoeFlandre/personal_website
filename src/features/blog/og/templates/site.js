import satori from "satori";
import { SITE } from "../../../../site-config.js";
import loadGoogleFonts from "../../../../utils/loadGoogleFont.ts";
import { createOgFrame, createOgRenderOptions } from "./frame.js";

function createSiteContent() {
  return [
    {
      type: "div",
      props: {
        style: {
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          height: "90%",
          maxHeight: "90%",
          overflow: "hidden",
          textAlign: "center",
        },
        children: [
          {
            type: "p",
            props: {
              style: { fontSize: 72, fontWeight: "bold" },
              children: SITE.title,
            },
          },
          {
            type: "p",
            props: {
              style: { fontSize: 28 },
              children: SITE.desc,
            },
          },
        ],
      },
    },
    {
      type: "div",
      props: {
        style: {
          display: "flex",
          justifyContent: "flex-end",
          width: "100%",
          marginBottom: "8px",
          fontSize: 28,
        },
        children: {
          type: "span",
          props: {
            style: { overflow: "hidden", fontWeight: "bold" },
            children: new URL(SITE.website).hostname,
          },
        },
      },
    },
  ];
}

export default async () => {
  const fonts = await loadGoogleFonts();
  return satori(createOgFrame(createSiteContent()), createOgRenderOptions(fonts));
};
