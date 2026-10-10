export const IMAGE_THUMBNAIL_DIRECTORY = "generated/image-thumbnails";
export const ABOUT_PORTRAIT_PATH = "/image.png";
const THUMBNAIL_ROOT = `/${IMAGE_THUMBNAIL_DIRECTORY}`;

/**
 * Removes a query string or hash from a source path.
 *
 * @param {string} sourcePath Path such as "/assets/img/a.png?v=1".
 * @returns {string} The path without its query string or hash.
 */
export function stripQueryAndHash(sourcePath) {
  return sourcePath.split(/[?#]/, 1)[0];
}

/**
 * Splits a root-relative image path into its directory segments and a `.webp` file name.
 *
 * @param {string | null | undefined} sourcePath Root-relative path, such as "/assets/img/a.png?v=1".
 * @returns {{ segments: string[], fileName: string } | null} Null when the path is not root-relative or has no file name.
 */
function getThumbnailParts(sourcePath) {
  if (!sourcePath || !sourcePath.startsWith("/")) return null;

  const cleanPath = stripQueryAndHash(sourcePath);
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
  if (!getThumbnailParts(sourcePath)) return sourcePath;

  return `${THUMBNAIL_ROOT}/${encodeURIComponent(getImageThumbnailFileName(sourcePath))}`;
}
