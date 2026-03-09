import { resolve, join } from "path";
import { existsSync, readFileSync } from "fs";
import { Readable } from "stream";
import archiver from "archiver";
import { toCSV } from "@scraper/utils";

const outputDir = resolve(process.cwd(), "..", "output");

function contentDisposition(filename: string): string {
  const encoded = encodeURIComponent(filename).replace(/'/g, "%27");
  return `attachment; filename="${filename.replace(/[^\x20-\x7E]/g, "_")}"; filename*=UTF-8''${encoded}`;
}

function isValidDirName(name: string): boolean {
  return (
    name.length > 0 &&
    !name.includes("/") &&
    !name.includes("\\") &&
    !name.includes("..") &&
    name !== "."
  );
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ dirName: string }> }
) {
  const { dirName } = await params;

  if (!isValidDirName(dirName)) {
    return new Response("Invalid directory name", { status: 400 });
  }

  const dirPath = resolve(outputDir, dirName);

  if (!dirPath.startsWith(outputDir) || !existsSync(dirPath)) {
    return new Response("Not found", { status: 404 });
  }

  const url = new URL(req.url);
  const format = url.searchParams.get("format") || "json";
  const jsonPath = join(dirPath, "reviews.json");

  if (!existsSync(jsonPath)) {
    return new Response("reviews.json not found in directory", { status: 404 });
  }

  const result = JSON.parse(readFileSync(jsonPath, "utf-8"));

  if (format === "json") {
    return new Response(JSON.stringify(result, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": contentDisposition(`${dirName}.json`),
      },
    });
  }

  if (format === "csv") {
    return new Response(toCSV(result), {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": contentDisposition(`${dirName}.csv`),
      },
    });
  }

  if (format === "zip") {
    const archive = archiver("zip", { zlib: { level: 9 } });

    archive.append(JSON.stringify(result, null, 2), { name: "reviews.json" });
    archive.append(toCSV(result), { name: "reviews.csv" });

    const imagesDir = join(dirPath, "images");
    if (existsSync(imagesDir)) {
      archive.directory(imagesDir, "images");
    }

    archive.finalize();

    const readable = Readable.toWeb(archive) as unknown as ReadableStream;

    return new Response(readable, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": contentDisposition(`${dirName}.zip`),
      },
    });
  }

  return new Response("Invalid format. Use json, csv, or zip.", {
    status: 400,
  });
}
