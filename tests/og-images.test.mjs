import assert from "node:assert/strict";
import test from "node:test";
import { createServer } from "vite";
import { SITE } from "../src/site-config.js";

const post = { data: { title: "Mutation test title", author: "Mutation author" } };

async function loadTemplateModules() {
  const server = await createServer({
    appType: "custom",
    root: process.cwd(),
    optimizeDeps: { noDiscovery: true },
    ssr: { noExternal: ["satori"] },
    server: { middlewareMode: true, hmr: false, ws: false },
    plugins: [
      {
        name: "og-template-dependency-stubs",
        enforce: "pre",
        resolveId(id) {
          if (id === "satori") return "\0satori-og-test";
          if (id.includes("/src/utils/loadGoogleFont")) return "\0fonts-og-test";
          return undefined;
        },
        load(id) {
          if (id === "\0satori-og-test") {
            return `export default async (tree, options) => JSON.stringify({ tree, options });`;
          }
          if (id === "\0fonts-og-test") {
            return `export default async () => [{
              name: "Atkinson",
              data: new ArrayBuffer(1),
              weight: 400,
              style: "normal",
            }];
            `;
          }
          return undefined;
        },
      },
    ],
  });

  try {
    const postTemplate = (await server.ssrLoadModule("/src/features/blog/og/templates/post.js"))
      .default;
    const siteTemplate = (await server.ssrLoadModule("/src/features/blog/og/templates/site.js"))
      .default;
    return {
      postTemplate,
      siteTemplate,
      close: () => server.close(),
    };
  } catch (error) {
    await server.close();
    throw error;
  }
}

async function loadImageGenerator() {
  const server = await createServer({
    appType: "custom",
    root: process.cwd(),
    optimizeDeps: { noDiscovery: true },
    ssr: { noExternal: ["@resvg/resvg-js"] },
    server: { middlewareMode: true, hmr: false, ws: false },
    plugins: [
      {
        name: "og-generator-dependency-stubs",
        enforce: "pre",
        resolveId(id) {
          if (id === "@resvg/resvg-js") return "\0resvg-og-test";
          if (id.endsWith("/src/features/blog/og/templates/post.js")) return "\0post-og-test";
          if (id.endsWith("/src/features/blog/og/templates/site.js")) return "\0site-og-test";
          return undefined;
        },
        load(id) {
          if (id === "\0resvg-og-test") {
            return `export class Resvg {
              constructor(svg) { this.svg = svg; }
              render() { return { asPng: () => new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]) }; }
            }`;
          }
          if (id === "\0post-og-test") {
            return `export default async (value) => "post-svg:" + value.data.title;`;
          }
          if (id === "\0site-og-test") {
            return `export default async () => "site-svg";`;
          }
          return undefined;
        },
      },
    ],
    resolve: {
      alias: { "@": new URL("../src", import.meta.url).pathname },
    },
  });

  try {
    return {
      module: await server.ssrLoadModule("/src/features/blog/og/generateOgImages.ts"),
      close: () => server.close(),
    };
  } catch (error) {
    await server.close();
    throw error;
  }
}

test("post and site OG templates preserve their content and rendering contract", async () => {
  const { close, postTemplate, siteTemplate } = await loadTemplateModules();

  try {
    const postResult = JSON.parse(await postTemplate(post));
    assert.equal(postResult.options.width, 1200);
    assert.equal(postResult.options.height, 630);
    assert.equal(postResult.options.embedFont, true);
    assert.equal(postResult.options.fonts[0].name, "Atkinson");
    assert.equal(
      postResult.tree.props.children[1].props.children.props.children[0].props.children,
      "Mutation test title"
    );
    assert.equal(
      postResult.tree.props.children[1].props.children.props.children[1].props.children[0].props
        .children[2].props.children,
      "Mutation author"
    );

    const siteResult = JSON.parse(await siteTemplate());
    assert.equal(siteResult.options.width, 1200);
    assert.equal(siteResult.options.height, 630);
    assert.equal(siteResult.options.embedFont, true);
    assert.equal(
      siteResult.tree.props.children[1].props.children.props.children[0].props.children[0].props
        .children,
      SITE.title
    );
    assert.equal(
      siteResult.tree.props.children[1].props.children.props.children[0].props.children[1].props
        .children,
      SITE.desc
    );
    assert.equal(siteResult.options.fonts[0].name, "Atkinson");

    assert.deepEqual(postResult.tree, {
      type: "div",
      props: {
        style: {
          background: "#fefbfb",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        },
        children: [
          {
            type: "div",
            props: {
              style: {
                position: "absolute",
                top: "-1px",
                right: "-1px",
                border: "4px solid #000",
                background: "#ecebeb",
                opacity: "0.9",
                borderRadius: "4px",
                display: "flex",
                justifyContent: "center",
                margin: "2.5rem",
                width: "88%",
                height: "80%",
              },
            },
          },
          {
            type: "div",
            props: {
              style: {
                border: "4px solid #000",
                background: "#fefbfb",
                borderRadius: "4px",
                display: "flex",
                justifyContent: "center",
                margin: "2rem",
                width: "88%",
                height: "80%",
              },
              children: {
                type: "div",
                props: {
                  style: {
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    margin: "20px",
                    width: "90%",
                    height: "90%",
                  },
                  children: [
                    {
                      type: "p",
                      props: {
                        style: {
                          fontSize: 72,
                          fontWeight: "bold",
                          maxHeight: "84%",
                          overflow: "hidden",
                        },
                        children: "Mutation test title",
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
                                  props: { style: { color: "transparent" }, children: '"' },
                                },
                                {
                                  type: "span",
                                  props: {
                                    style: { overflow: "hidden", fontWeight: "bold" },
                                    children: "Mutation author",
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
                  ],
                },
              },
            },
          },
        ],
      },
    });

    assert.deepEqual(siteResult.tree, {
      type: "div",
      props: {
        style: {
          background: "#fefbfb",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        },
        children: [
          {
            type: "div",
            props: {
              style: {
                position: "absolute",
                top: "-1px",
                right: "-1px",
                border: "4px solid #000",
                background: "#ecebeb",
                opacity: "0.9",
                borderRadius: "4px",
                display: "flex",
                justifyContent: "center",
                margin: "2.5rem",
                width: "88%",
                height: "80%",
              },
            },
          },
          {
            type: "div",
            props: {
              style: {
                border: "4px solid #000",
                background: "#fefbfb",
                borderRadius: "4px",
                display: "flex",
                justifyContent: "center",
                margin: "2rem",
                width: "88%",
                height: "80%",
              },
              children: {
                type: "div",
                props: {
                  style: {
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    margin: "20px",
                    width: "90%",
                    height: "90%",
                  },
                  children: [
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
                            children: "noeflandre.com",
                          },
                        },
                      },
                    },
                  ],
                },
              },
            },
          },
        ],
      },
    });
  } finally {
    await close();
  }
});

test("OG image generation converts both SVG templates to PNG bytes", async () => {
  const { close, module } = await loadImageGenerator();

  try {
    const expected = [137, 80, 78, 71, 13, 10, 26, 10];
    assert.deepEqual([...(await module.generateOgImageForPost(post))], expected);
    assert.deepEqual([...(await module.generateOgImageForSite())], expected);
  } finally {
    await close();
  }
});
