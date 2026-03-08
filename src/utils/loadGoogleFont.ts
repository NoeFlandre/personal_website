import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const currentDir = path.dirname(fileURLToPath(import.meta.url));

const fontsConfig = [
  {
    name: "Atkinson",
    filePath: path.resolve(currentDir, "../../public/fonts/atkinson-regular.woff"),
    weight: 400,
    style: "normal",
  },
  {
    name: "Atkinson",
    filePath: path.resolve(currentDir, "../../public/fonts/atkinson-bold.woff"),
    weight: 700,
    style: "normal",
  },
] as const;

async function loadLocalFont(filePath: string): Promise<ArrayBuffer> {
  const fontBuffer = await readFile(filePath);
  return Uint8Array.from(fontBuffer).buffer;
}

async function loadGoogleFonts() {
  return Promise.all(
    fontsConfig.map(async ({ name, filePath, weight, style }) => ({
      name,
      data: await loadLocalFont(filePath),
      weight,
      style,
    }))
  );
}

export default loadGoogleFonts;
