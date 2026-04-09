export function toAbsoluteUrl(input: string | URL, base: string | URL): string {
  return new URL(input, base).href;
}

export function getAbsoluteUrlBase(
  configuredBase: string | URL | undefined,
  fallbackBase: string | URL
): string | URL {
  return configuredBase ?? fallbackBase;
}
