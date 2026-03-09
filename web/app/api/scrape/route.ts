import { NextResponse } from "next/server";
import { resolve, join } from "path";
import { mkdirSync, writeFileSync } from "fs";
import { createJob, addProgress, completeJob, failJob } from "@/lib/job-store";
import { scrapeReviews, downloadProfilePics } from "@scraper/scraper";
import { isValidGoogleMapsUrl, getExportDir, toCSV } from "@scraper/utils";

export async function POST(req: Request) {
  const body = await req.json();
  const { url: input, maxReviews = 50, minStars, sort, aiRank } = body;

  if (!input || typeof input !== "string") {
    return NextResponse.json(
      { error: "URL or place name is required" },
      { status: 400 }
    );
  }

  let url: string;
  if (isValidGoogleMapsUrl(input)) {
    url = input;
  } else {
    url = `https://www.google.com/maps/search/${encodeURIComponent(input)}`;
  }

  const job = createJob();
  job.status = "scraping";

  // Run scrape in background (don't await)
  (async () => {
    try {
      const onProgress = (message: string) => addProgress(job, message);

      const result = await scrapeReviews({
        url,
        maxReviews,
        headless: true,
        minStars,
        aiRank,
        sort,
        onProgress,
      });

      // Save files to project root output/
      const projectRoot = resolve(process.cwd(), "..");
      const exportDir = join(projectRoot, getExportDir(result.business.name));
      mkdirSync(exportDir, { recursive: true });

      onProgress("Downloading profile pictures...");
      await downloadProfilePics(result.reviews, exportDir, onProgress);

      writeFileSync(
        join(exportDir, "reviews.json"),
        JSON.stringify(result, null, 2)
      );
      writeFileSync(join(exportDir, "reviews.csv"), toCSV(result));

      onProgress(`Output saved to: ${exportDir}/`);
      completeJob(job, result, exportDir);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      failJob(job, message);
    }
  })();

  return NextResponse.json({ jobId: job.id });
}
