import { NextResponse } from "next/server";
import { validateApiKey } from "@/lib/api-key";
import { uploadImage, MAX_FILE_SIZE, ALLOWED_TYPES } from "@/lib/s3";

export async function POST(req: Request) {
  const user = await validateApiKey(req);
  if (!user) {
    return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
  }

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
  const key = await uploadImage(buffer, file.type, extension);

  const origin = new URL(req.url).origin;
  return NextResponse.json({ url: `${origin}/api/images/${key}` });
}
