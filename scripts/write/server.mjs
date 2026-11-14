import { readFile, stat } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";
import { listMedia, MAX_UPLOAD_BYTES, saveUpload, setHeroFields } from "./media.mjs";
import { createPost, listPosts, readPost, WriterError, writePost } from "./posts.mjs";
import { findBuiltStylesheet, renderPreview } from "./render.mjs";

const MAX_BODY_BYTES = 5 * 1024 * 1024;
const LOOPBACK_HOSTNAMES = new Set(["127.0.0.1", "localhost"]);

const CONTENT_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".gif": "image/gif",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".mp3": "audio/mpeg",
  ".pdf": "application/pdf",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".webmanifest": "application/manifest+json",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

function sendJson(res, status, data) {
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
  });
  res.end(JSON.stringify(data));
}

async function sendFile(res, file) {
  const body = await readFile(file);
  res.writeHead(200, {
    "content-type": CONTENT_TYPES[path.extname(file)] ?? "application/octet-stream",
    "cache-control": "no-store",
  });
  res.end(body);
}

async function readBody(req, limit) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > limit) throw new WriterError(413, "Request is too large");
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

async function readJsonBody(req) {
  const body = await readBody(req, MAX_BODY_BYTES);
  if (body.length === 0) return {};
  try {
    return JSON.parse(body.toString("utf8"));
  } catch {
    throw new WriterError(400, "Body must be JSON");
  }
}

// A browser page on another site can reach 127.0.0.1, so the writer only trusts
// its own host name, and only answers API calls that carry a custom header
// (which cross-site pages cannot send without a CORS preflight we never allow).
function hostnameOf(host) {
  return (host ?? "").split(":")[0];
}

function isLoopbackOrigin(origin) {
  try {
    const url = new URL(origin);
    return url.protocol === "http:" && LOOPBACK_HOSTNAMES.has(url.hostname);
  } catch {
    return false;
  }
}

async function handleApi(req, res, url, { root, publicDir, distDir }) {
  const { method } = req;
  const route = `${method} ${url.pathname}`;

  if (route === "GET /api/posts") {
    return sendJson(res, 200, await listPosts(root));
  }
  if (route === "POST /api/upload") {
    const data = await readBody(req, MAX_UPLOAD_BYTES);
    const saved = await saveUpload({
      root,
      publicDir,
      postPath: url.searchParams.get("postPath"),
      filename: url.searchParams.get("filename"),
      data,
    });
    return sendJson(res, 201, saved);
  }
  if (route === "GET /api/media") {
    return sendJson(
      res,
      200,
      await listMedia({ publicDir, postPath: url.searchParams.get("path") })
    );
  }
  if (route === "POST /api/hero") {
    const { content, url: heroUrl, alt } = await readJsonBody(req);
    if (typeof content !== "string" || typeof heroUrl !== "string") {
      throw new WriterError(400, "content and url must be strings");
    }
    return sendJson(res, 200, { content: setHeroFields(content, { url: heroUrl, alt }) });
  }
  if (route === "GET /api/post") {
    return sendJson(res, 200, await readPost(root, url.searchParams.get("path")));
  }
  if (route === "POST /api/post") {
    const { path: postPath, content } = await readJsonBody(req);
    if (typeof content !== "string") throw new WriterError(400, "content must be a string");
    return sendJson(res, 200, await writePost(root, postPath, content));
  }
  if (route === "POST /api/posts") {
    const { title } = await readJsonBody(req);
    return sendJson(res, 201, await createPost(root, { title }));
  }
  if (route === "POST /api/render") {
    const { markdown } = await readJsonBody(req);
    if (typeof markdown !== "string") throw new WriterError(400, "markdown must be a string");
    const stylesheetHref = await findBuiltStylesheet(distDir);
    const html = await renderPreview({ markdown, stylesheetHref });
    return sendJson(res, 200, { html, styled: stylesheetHref !== null });
  }
  return sendJson(res, 404, { error: "Not found" });
}

async function serveStatic(res, pathname, { publicDir, distDir }) {
  let relative;
  try {
    relative = decodeURIComponent(pathname).replace(/^\/+/, "");
  } catch {
    return sendJson(res, 400, { error: "Bad path" });
  }

  // public/ first (images and fonts you edit), then the last build's dist/ (CSS and JS).
  for (const base of [publicDir, distDir]) {
    const full = path.resolve(base, relative);
    if (!full.startsWith(path.resolve(base) + path.sep)) continue;
    try {
      if ((await stat(full)).isFile()) return await sendFile(res, full);
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
  }
  return sendJson(res, 404, { error: "Not found" });
}

async function handle(req, res, options) {
  // Upload and hero routes read their own bodies; everything else is capped at MAX_BODY_BYTES.
  const url = new URL(req.url ?? "/", "http://127.0.0.1");

  if (!LOOPBACK_HOSTNAMES.has(hostnameOf(req.headers.host))) {
    return sendJson(res, 403, { error: "Forbidden host" });
  }

  if (url.pathname.startsWith("/api/")) {
    if (req.headers["x-writer"] !== "1")
      return sendJson(res, 403, { error: "Missing writer header" });
    if (req.headers.origin && !isLoopbackOrigin(req.headers.origin)) {
      return sendJson(res, 403, { error: "Forbidden origin" });
    }
    return handleApi(req, res, url, options);
  }

  if (req.method !== "GET") return sendJson(res, 405, { error: "Method not allowed" });
  if (url.pathname === "/") return sendFile(res, options.indexHtmlPath);
  return serveStatic(res, url.pathname, options);
}

/** Local-only writing tool. Nothing in the site build imports this module. */
export function createWriterServer({ root, publicDir, distDir, indexHtmlPath }) {
  const options = { root, publicDir, distDir, indexHtmlPath };
  return createServer(async (req, res) => {
    try {
      await handle(req, res, options);
    } catch (error) {
      if (error instanceof WriterError) {
        return sendJson(res, error.status, { error: error.message });
      }
      console.error(error);
      return sendJson(res, 500, { error: "Something went wrong" });
    }
  });
}
