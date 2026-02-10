import { NextResponse } from "next/server";
import { getPresignedImageUrl } from "@/lib/s3";
import { withErrorHandling } from "@/lib/api-utils";

async function _GET(
  _req: Request,
  { params }: { params: Promise<{ key: string[] }> }
) {
  const { key } = await params;
  const s3Key = key.join("/");

  if (!s3Key.startsWith("posts/") && !s3Key.startsWith("avatars/")) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const url = await getPresignedImageUrl(s3Key);

  // Cache the redirect for less than the presigned URL lifetime (3600s)
  // to prevent serving expired S3 URLs from cache.
  return NextResponse.redirect(url, {
    status: 302,
    headers: {
      "Cache-Control": "public, max-age=3000, stale-while-revalidate=600",
    },
  });
}
export const GET = withErrorHandling(_GET);
