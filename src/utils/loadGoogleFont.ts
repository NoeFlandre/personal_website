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

type LoadedFont = {
  name: string;
  data: ArrayBuffer;
  weight: number;
  style: string;
};

let fontsPromise: Promise<LoadedFont[]> | undefined;

async function loadLocalFont(filePath: string): Promise<ArrayBuffer> {
  const fontBuffer = await readFile(filePath);
  return Uint8Array.from(fontBuffer).buffer;
}

async function loadGoogleFonts() {
  if (!fontsPromise) {
    fontsPromise = Promise.all(
      fontsConfig.map(async ({ name, filePath, weight, style }) => ({
        name,
        data: await loadLocalFont(filePath),
        weight,
        style,
      }))
    );
  }

  return fontsPromise;
}

export default loadGoogleFonts;
