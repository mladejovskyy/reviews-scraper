import { join } from "path";
import type { ScrapeResult } from "./scraper";

export function upscaleProfilePicUrl(url: string): string {
  // Handle =w36-h36-... format → =w512-h512-...
  // Handle =s72-c format → =s512-c
  return url
    .replace(/=w\d+-h\d+/, "=w512-h512")
    .replace(/=s\d+-c/, "=s512-c");
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

export function sanitizeFilename(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9\u00C0-\u024F\u1E00-\u1EFF -]/g, "")
    .replace(/\s+/g, "-")
    .toLowerCase()
    .slice(0, 50) || "unknown";
}

export function getOutputFilePath(format: string): string {
  const timestamp = new Date()
    .toISOString()
    .replace(/:/g, "-")
    .replace(/\.\d+Z$/, "");
  return join("output", `reviews-${timestamp}.${format}`);
}

function csvEscape(value: string | number | undefined): string {
  const str = value == null ? "" : String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function toCSV(result: ScrapeResult): string {
  const headers = ["reviewerName", "stars", "date", "text", "profilePicUrl", "profilePicPath", "relevanceScore"];
  const lines = [headers.join(",")];

  for (const r of result.reviews) {
    lines.push(
      [
        csvEscape(r.reviewerName),
        csvEscape(r.stars),
        csvEscape(r.date),
        csvEscape(r.text),
        csvEscape(r.profilePicUrl),
        csvEscape(r.profilePicPath),
        csvEscape(r.relevanceScore),
      ].join(",")
    );
  }

  return lines.join("\n") + "\n";
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  maxAttempts = 3,
  baseDelayMs = 2000
): Promise<T> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxAttempts) throw error;
      const delay = baseDelayMs * attempt;
      const msg = error instanceof Error ? error.message : String(error);
      console.log(`Attempt ${attempt}/${maxAttempts} failed: ${msg}. Retrying in ${delay}ms...`);
      await randomDelay(delay, delay + 1000);
    }
  }
  throw new Error("Retries exhausted");
}
