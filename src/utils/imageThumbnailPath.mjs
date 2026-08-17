export const IMAGE_THUMBNAIL_DIRECTORY = "generated/image-thumbnails";
const THUMBNAIL_ROOT = `/${IMAGE_THUMBNAIL_DIRECTORY}`;

function getThumbnailParts(sourcePath) {
  if (!sourcePath || !sourcePath.startsWith("/")) return sourcePath;

  const cleanPath = sourcePath.split(/[?#]/, 1)[0];
  const segments = cleanPath.slice(1).split("/").filter(Boolean);
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
