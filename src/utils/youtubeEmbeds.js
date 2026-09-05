const YOUTUBE_EMBED_CLASS = "youtube-embed-container";
const YOUTUBE_ID_PATTERN = /^[A-Za-z0-9_-]+$/;

export function normalizeYouTubeId(input) {
  if (typeof input !== "string") return "";

  const id = input.trim();
  return YOUTUBE_ID_PATTERN.test(id) ? id : "";
}

function extractWatchId(input) {
  if (!input.includes("youtube.com/watch")) return null;

  if (!URL.canParse(input)) return "";

  const url = new URL(input);
  return normalizeYouTubeId(url.searchParams.get("v"));
}

function extractPathId(input, marker) {
  if (!input.includes(marker)) return null;
  const path = input.split(marker)[1];
  return normalizeYouTubeId(path.split(/[?#]/)[0]);
}

export function extractYouTubeId(input) {
  if (typeof input !== "string") return "";

  return (
    extractWatchId(input) ??
    extractPathId(input, "youtu.be/") ??
    extractPathId(input, "youtube.com/embed/") ??
    normalizeYouTubeId(input)
  );
}

export function getYouTubeEmbedSrc(input) {
  return `https://www.youtube.com/embed/${extractYouTubeId(input)}`;
}

export function buildYouTubeEmbedMarkup(input) {
  return `<div class="${YOUTUBE_EMBED_CLASS}">
    <iframe
      width="560"
      height="315"
      src="${getYouTubeEmbedSrc(input)}"
      title="YouTube video player"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowfullscreen
    ></iframe>
  </div>`;
}
