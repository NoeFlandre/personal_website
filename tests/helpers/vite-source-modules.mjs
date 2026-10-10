import { fileURLToPath } from "node:url";
import { createServer } from "vite";

export function astroContentStubPlugin(source) {
  const stubId = "\0astro-content-test-stub";

  return {
    name: "astro-content-test-stub",
    enforce: "pre",
    resolveId(id) {
      return id === "astro:content" ? stubId : undefined;
    },
    load(id) {
      return id === stubId ? source : undefined;
    },
  };
}

export async function loadSourceModule(modulePaths, { plugins = [], ssr = {}, nodeEnv } = {}) {
  // Vite reads NODE_ENV when the server starts, and that sets import.meta.env.DEV.
  const previousNodeEnv = process.env.NODE_ENV;
  if (nodeEnv !== undefined) process.env.NODE_ENV = nodeEnv;

  let server;
  try {
    server = await createServer({
      appType: "custom",
      root: process.cwd(),
      optimizeDeps: { noDiscovery: true },
      ssr,
      server: { middlewareMode: true, hmr: false, ws: false },
      resolve: {
        alias: { "@": fileURLToPath(new URL("../../src", import.meta.url)) },
      },
      plugins,
    });
  } finally {
    if (nodeEnv !== undefined) process.env.NODE_ENV = previousNodeEnv;
  }

  try {
    const modules = {};
    for (const [name, modulePath] of Object.entries(modulePaths)) {
      modules[name] = await server.ssrLoadModule(modulePath);
    }
    return { modules, close: () => server.close() };
  } catch (error) {
    await server.close();
    throw error;
  }
}
