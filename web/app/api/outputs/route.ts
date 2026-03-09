import { NextResponse } from "next/server";
import { resolve, join } from "path";
import { readdirSync, readFileSync, statSync } from "fs";

const outputDir = resolve(process.cwd(), "..", "output");

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const entries = readdirSync(outputDir, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => {
        const dirPath = join(outputDir, d.name);
        const jsonPath = join(dirPath, "reviews.json");

        try {
          const raw = readFileSync(jsonPath, "utf-8");
          const data = JSON.parse(raw);
          const reviews: { stars: number }[] = data.reviews || [];
          const avgStars =
            reviews.length > 0
              ? reviews.reduce((s: number, r: { stars: number }) => s + r.stars, 0) / reviews.length
              : 0;
          return {
            dirName: d.name,
            businessName: data.business?.name || d.name,
            rating: data.business?.rating || 0,
            totalReviews: data.business?.totalReviews || 0,
            reviewCount: reviews.length,
            avgStars: Math.round(avgStars * 10) / 10,
            scrapedAt: data.scrapedAt || statSync(dirPath).mtime.toISOString(),
          };
        } catch {
          return {
            dirName: d.name,
            businessName: d.name,
            rating: 0,
            totalReviews: 0,
            reviewCount: 0,
            avgStars: 0,
            scrapedAt: statSync(dirPath).mtime.toISOString(),
          };
        }
      })
      .sort(
        (a, b) =>
          new Date(b.scrapedAt).getTime() - new Date(a.scrapedAt).getTime()
      );

    return NextResponse.json(entries);
  } catch {
    return NextResponse.json([]);
  }
}
