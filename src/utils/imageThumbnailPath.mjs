export const IMAGE_THUMBNAIL_DIRECTORY = "generated/image-thumbnails";
const THUMBNAIL_ROOT = `/${IMAGE_THUMBNAIL_DIRECTORY}`;

/**
 * Splits a root-relative image path into its directory segments and a `.webp` file name.
 *
 * @param {string | null | undefined} sourcePath Root-relative path, such as "/assets/img/a.png?v=1".
 * @returns {{ segments: string[], fileName: string } | null} Null when the path is not root-relative or has no file name.
 */
function getThumbnailParts(sourcePath) {
  if (!sourcePath || !sourcePath.startsWith("/")) return null;

  const cleanPath = sourcePath.split(/[?#]/, 1)[0];
  const segments = cleanPath.split("/").filter(Boolean);
  const fileName = segments.pop();

  if (!fileName) return null;

  const extensionIndex = fileName.lastIndexOf(".");
  const stem = extensionIndex > 0 ? fileName.slice(0, extensionIndex) : fileName;
  return { segments, fileName: `${stem}.webp` };
}

export function getImageThumbnailFileName(sourcePath) {
  const parts = getThumbnailParts(sourcePath);
  if (!parts) return sourcePath;

  return [...parts.segments, parts.fileName].join("--");
}

export function getImageThumbnailPath(sourcePath) {
  const parts = getThumbnailParts(sourcePath);
  if (!parts) return sourcePath;

  const encodedPath = [...parts.segments, parts.fileName]
    .map((segment) => encodeURIComponent(segment))
    .join("--");

  return `${THUMBNAIL_ROOT}/${encodedPath}`;
}
