export const PLACE_TYPE_ORDER = {
  work: 0,
  study: 1,
  travel: 2,
};

export const PLACE_TYPE_LABELS = {
  work: "Worked",
  study: "Studied",
  travel: "Traveled",
};

/**
 * Returns the stable UI copy for an about-map place type.
 * Unknown values intentionally map to an empty label so callers can decide
 * whether to hide fallback copy or handle unsupported types explicitly.
 */
export function getPlaceTypeLabel(placeType) {
  return PLACE_TYPE_LABELS[placeType] ?? "";
}

export function sortPlacesForUi(places) {
  return [...places].sort((a, b) => {
    const left = PLACE_TYPE_ORDER[a.type] ?? Number.MAX_SAFE_INTEGER;
    const right = PLACE_TYPE_ORDER[b.type] ?? Number.MAX_SAFE_INTEGER;
    return left - right;
  });
}

export function parsePlacesDataset(rawValue) {
  if (!rawValue) return [];

  try {
    const parsed = JSON.parse(rawValue);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function shouldRetryMapInit(retryCount, maxRetries = 3) {
  return retryCount < maxRetries;
}

export function getMapRetryDelayMs(attemptNumber) {
  return 600 * attemptNumber;
}
