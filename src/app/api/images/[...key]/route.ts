import { NextResponse } from "next/server";
import { getPresignedImageUrl } from "@/lib/s3";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ key: string[] }> }
) {
  const { key } = await params;
  const s3Key = key.join("/");

  if (!s3Key.startsWith("posts/")) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const url = await getPresignedImageUrl(s3Key);

  return NextResponse.redirect(url, 302);
}
