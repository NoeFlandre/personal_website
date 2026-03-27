export function toAbsoluteUrl(input: string | URL, base: string | URL): string {
  return new URL(input, base).href;
}
