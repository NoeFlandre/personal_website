const YOUTUBE_EMBED_CLASS = "youtube-embed-container";
const YOUTUBE_ID_PATTERN = /^[A-Za-z0-9_-]+$/;

function normalizeYouTubeId(input) {
  if (typeof input !== "string") return "";

  const id = input.trim();
  return YOUTUBE_ID_PATTERN.test(id) ? id : "";
}

export function extractYouTubeId(input) {
  if (typeof input !== "string") return "";

  const trimmedInput = input.trim();
  if (!trimmedInput) return "";

  try {
    if (trimmedInput.includes("youtube.com/watch")) {
      const url = new URL(trimmedInput);
      return normalizeYouTubeId(url.searchParams.get("v"));
    }

    if (trimmedInput.includes("youtu.be/")) {
      return normalizeYouTubeId(trimmedInput.split("youtu.be/")[1]?.split(/[?#]/)[0]);
    }

    if (trimmedInput.includes("youtube.com/embed/")) {
      return normalizeYouTubeId(trimmedInput.split("youtube.com/embed/")[1]?.split(/[?#]/)[0]);
    }
  } catch (_) {
    return "";
  }

  return normalizeYouTubeId(trimmedInput);
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
