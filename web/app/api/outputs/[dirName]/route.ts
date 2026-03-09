import { NextResponse } from "next/server";
import { resolve } from "path";
import { existsSync, rmSync } from "fs";

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

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ dirName: string }> }
) {
  const { dirName } = await params;

  if (!isValidDirName(dirName)) {
    return NextResponse.json({ error: "Invalid directory name" }, { status: 400 });
  }

  const dirPath = resolve(outputDir, dirName);

  // Ensure resolved path is still inside output/
  if (!dirPath.startsWith(outputDir)) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }

  if (!existsSync(dirPath)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  rmSync(dirPath, { recursive: true, force: true });
  return NextResponse.json({ ok: true });
}
