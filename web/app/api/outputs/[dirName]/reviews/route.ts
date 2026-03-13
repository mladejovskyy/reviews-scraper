import { NextResponse } from "next/server";
import { resolve, join } from "path";
import { existsSync, readFileSync, writeFileSync } from "fs";
import { toCSV } from "@scraper/utils";

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

export async function DELETE(
  req: Request,
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

  const body = await req.json();
  const { index } = body;

  if (typeof index !== "number" || index < 0) {
    return NextResponse.json({ error: "Invalid index" }, { status: 400 });
  }

  const data = JSON.parse(readFileSync(jsonPath, "utf-8"));

  if (index >= data.reviews.length) {
    return NextResponse.json({ error: "Index out of range" }, { status: 400 });
  }

  data.reviews.splice(index, 1);

  writeFileSync(jsonPath, JSON.stringify(data, null, 2));
  writeFileSync(join(dirPath, "reviews.csv"), toCSV(data));

  return NextResponse.json(data);
}
