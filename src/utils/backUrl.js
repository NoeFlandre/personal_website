export const BACK_URL_KEY = "backUrl";

/* sessionStorage can throw when storage is blocked, so reads and writes fail soft. */
export function getBackUrl() {
  try {
    return sessionStorage.getItem(BACK_URL_KEY);
  } catch {
    return null;
  }
}

export function setBackUrl(url) {
  try {
    sessionStorage.setItem(BACK_URL_KEY, url);
  } catch {
    // Without storage the back button keeps its default href.
  }
}
