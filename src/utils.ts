import { join } from "path";

export function upscaleProfilePicUrl(url: string): string {
  return url.replace(/=s\d+-c/, "=s256-c");
}

export function randomDelay(min: number, max: number): Promise<void> {
  const ms = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function isValidGoogleMapsUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return (
      (parsed.hostname === "www.google.com" ||
        parsed.hostname === "google.com" ||
        parsed.hostname === "maps.google.com" ||
        parsed.hostname === "maps.app.goo.gl") &&
      (parsed.pathname.includes("/maps/place/") ||
        parsed.hostname === "maps.app.goo.gl")
    );
  } catch {
    return false;
  }
}

export function getOutputFilePath(format: string): string {
  const timestamp = new Date()
    .toISOString()
    .replace(/:/g, "-")
    .replace(/\.\d+Z$/, "");
  return join("output", `reviews-${timestamp}.${format}`);
}
