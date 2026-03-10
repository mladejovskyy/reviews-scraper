import { NextResponse } from "next/server";
import { resolve, join } from "path";
import { existsSync, readFileSync } from "fs";

const outputDir = resolve(process.cwd(), "..", "output");

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
  _req: Request,
  { params }: { params: Promise<{ dirName: string }> }
) {
  const { dirName } = await params;

  if (!isValidDirName(dirName)) {
    return NextResponse.json({ error: "Invalid directory name" }, { status: 400 });
  }

  const dirPath = resolve(outputDir, dirName);

  if (!dirPath.startsWith(outputDir) || !existsSync(dirPath)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const jsonPath = join(dirPath, "reviews.json");
  if (!existsSync(jsonPath)) {
    return NextResponse.json({ error: "reviews.json not found" }, { status: 404 });
  }

  const data = JSON.parse(readFileSync(jsonPath, "utf-8"));
  return NextResponse.json(data);
}
