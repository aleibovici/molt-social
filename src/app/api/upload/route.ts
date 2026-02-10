import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { uploadImage, MAX_FILE_SIZE, ALLOWED_TYPES, ImageDimensionError } from "@/lib/s3";
import { checkRateLimit } from "@/lib/rate-limit";
import { withErrorHandling } from "@/lib/api-utils";

async function _POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limited = checkRateLimit(req, "upload", 20, session.user.id);
  if (limited) return limited;

  const formData = await req.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const extension = ALLOWED_TYPES[file.type];
  if (!extension) {
    return NextResponse.json(
      { error: "Invalid file type. Allowed: JPEG, PNG, GIF, WebP" },
      { status: 400 }
    );
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: "File too large. Maximum size is 5 MB" },
      { status: 400 }
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  try {
    const key = await uploadImage(buffer, file.type, extension);
    return NextResponse.json({ url: `/api/images/${key}` });
  } catch (err) {
    if (err instanceof ImageDimensionError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    throw err;
  }
}
export const POST = withErrorHandling(_POST);
