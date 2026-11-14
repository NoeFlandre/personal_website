// Starts the local blog writer: `npm run write`, then open the printed URL.
// It is a plain Node server, not part of the Astro site, so it is never built or deployed.
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createWriterServer } from "./write/server.mjs";

const repo = fileURLToPath(new URL("..", import.meta.url));
const port = Number(process.env.WRITE_PORT ?? 4330);

const server = createWriterServer({
  // Same folder the blog loads from (see src/features/blog/contentPaths.ts).
  root: path.join(repo, "src/content/blog"),
  publicDir: path.join(repo, "public"),
  distDir: path.join(repo, "dist"),
  indexHtmlPath: path.join(repo, "scripts/write/index.html"),
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Local blog writer: http://127.0.0.1:${port}`);
  console.log("Local only. Not part of the site build. Stop with Ctrl+C.");
});
