import { mkdir, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

/** Temporary blog and public folders for writer tests. close() deletes them. */
export async function createWriterFixture() {
  const base = await mkdtemp(path.join(tmpdir(), "writer-test-"));
  const root = path.join(base, "blog");
  const publicDir = path.join(base, "public");
  await mkdir(root, { recursive: true });
  await mkdir(publicDir, { recursive: true });
  return { base, root, publicDir, close: () => rm(base, { recursive: true, force: true }) };
}
