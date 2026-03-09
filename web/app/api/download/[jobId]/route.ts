import { getJob } from "@/lib/job-store";
import { toCSV } from "@scraper/utils";
import { existsSync } from "fs";
import { join, basename } from "path";
import archiver from "archiver";
import { Readable } from "stream";

function contentDisposition(filename: string): string {
  const encoded = encodeURIComponent(filename).replace(/'/g, "%27");
  return `attachment; filename="${filename.replace(/[^\x20-\x7E]/g, "_")}"; filename*=UTF-8''${encoded}`;
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params;
  const job = getJob(jobId);

  if (!job || job.status !== "complete" || !job.result) {
    return new Response("Job not found or not complete", { status: 404 });
  }

  const url = new URL(req.url);
  const format = url.searchParams.get("format") || "json";
  const prefix = job.outputDir ? basename(job.outputDir) : "reviews";

  if (format === "json") {
    return new Response(JSON.stringify(job.result, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": contentDisposition(`${prefix}.json`),
      },
    });
  }

  if (format === "csv") {
    return new Response(toCSV(job.result), {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": contentDisposition(`${prefix}.csv`),
      },
    });
  }

  if (format === "zip") {
    if (!job.outputDir || !existsSync(job.outputDir)) {
      return new Response("Output files not found", { status: 404 });
    }

    const archive = archiver("zip", { zlib: { level: 9 } });

    // Add JSON and CSV
    archive.append(JSON.stringify(job.result, null, 2), {
      name: "reviews.json",
    });
    archive.append(toCSV(job.result), { name: "reviews.csv" });

    // Add images if they exist
    const imagesDir = join(job.outputDir, "images");
    if (existsSync(imagesDir)) {
      archive.directory(imagesDir, "images");
    }

    archive.finalize();

    // Convert Node stream to web ReadableStream
    const readable = Readable.toWeb(archive) as unknown as ReadableStream;

    return new Response(readable, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": contentDisposition(`${prefix}.zip`),
      },
    });
  }

  return new Response("Invalid format. Use json, csv, or zip.", {
    status: 400,
  });
}
