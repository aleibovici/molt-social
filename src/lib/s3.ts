import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "crypto";
import sharp from "sharp";

export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
  "image/webp": "webp",
};

const s3 = new S3Client({
  region: process.env.AWS_DEFAULT_REGION!,
  endpoint: process.env.AWS_ENDPOINT_URL!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
  forcePathStyle: true,
});

const bucket = () => process.env.AWS_S3_BUCKET_NAME!;

/**
 * Max width for post images.
 * The feed content area is 600px CSS wide; 1200px serves 2× retina perfectly.
 */
const POST_IMAGE_MAX_WIDTH = 1200;

/** Max dimension for animated GIFs (keep them reasonable without converting format). */
const GIF_MAX_WIDTH = 800;

/** Shared WebP encoding options – tuned for best file-size at acceptable quality. */
const WEBP_OPTIONS: Parameters<ReturnType<typeof sharp>["webp"]>[0] = {
  quality: 60,
  effort: 6, // max compression effort (0–6)
  smartSubsample: true, // better chroma sub-sampling
};

const MAX_IMAGE_DIMENSION = 8000;

/** Validate that image dimensions are within acceptable limits. */
async function validateDimensions(buffer: Buffer): Promise<void> {
  const metadata = await sharp(buffer).metadata();
  if (
    (metadata.width && metadata.width > MAX_IMAGE_DIMENSION) ||
    (metadata.height && metadata.height > MAX_IMAGE_DIMENSION)
  ) {
    throw new ImageDimensionError(
      `Image dimensions exceed ${MAX_IMAGE_DIMENSION}x${MAX_IMAGE_DIMENSION} limit`
    );
  }
}

export class ImageDimensionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ImageDimensionError";
  }
}

/** Optimize an image buffer: convert to WebP (resize GIFs in-place) and down-scale to feed dimensions. */
async function optimizeImage(
  buffer: Buffer,
  contentType: string
): Promise<{ buffer: Buffer; contentType: string; extension: string }> {
  await validateDimensions(buffer);
  // Animated GIFs: resize if oversized but keep as GIF to preserve animation
  if (contentType === "image/gif") {
    const optimized = await sharp(buffer, { animated: true })
      .resize({ width: GIF_MAX_WIDTH, withoutEnlargement: true })
      .gif()
      .toBuffer();
    return { buffer: optimized, contentType: "image/gif", extension: "gif" };
  }

  const optimized = await sharp(buffer)
    .resize({ width: POST_IMAGE_MAX_WIDTH, withoutEnlargement: true })
    .webp(WEBP_OPTIONS)
    .toBuffer();

  return { buffer: optimized, contentType: "image/webp", extension: "webp" };
}

/** Upload image to S3 and return the object key. Optimizes the image before upload. */
export async function uploadImage(
  buffer: Buffer,
  contentType: string,
  extension: string
): Promise<string> {
  const optimized = await optimizeImage(buffer, contentType);
  const key = `posts/${randomUUID()}.${optimized.extension}`;

  await s3.send(
    new PutObjectCommand({
      Bucket: bucket(),
      Key: key,
      Body: optimized.buffer,
      ContentType: optimized.contentType,
    })
  );

  return key;
}

/** Upload an avatar to S3 — resized to 200×200 square crop, converted to WebP. */
export async function uploadAvatar(
  buffer: Buffer,
  contentType: string
): Promise<string> {
  let optimized: Buffer;
  let ext: string;
  let ct: string;

  if (contentType === "image/gif") {
    // Resize animated GIFs to 200×200 but keep as GIF
    optimized = await sharp(buffer, { animated: true })
      .resize({ width: 200, height: 200, fit: "cover" })
      .gif()
      .toBuffer();
    ext = "gif";
    ct = "image/gif";
  } else {
    optimized = await sharp(buffer)
      .resize({ width: 200, height: 200, fit: "cover" })
      .webp(WEBP_OPTIONS)
      .toBuffer();
    ext = "webp";
    ct = "image/webp";
  }

  const key = `avatars/${randomUUID()}.${ext}`;

  await s3.send(
    new PutObjectCommand({
      Bucket: bucket(),
      Key: key,
      Body: optimized,
      ContentType: ct,
    })
  );

  return key;
}

/** Delete an image from S3 by its object key. */
export async function deleteImage(key: string): Promise<void> {
  await s3.send(
    new DeleteObjectCommand({ Bucket: bucket(), Key: key })
  );
}

/** Generate a presigned GET URL for an S3 key (1 hour expiry). */
export async function getPresignedImageUrl(key: string): Promise<string> {
  return getSignedUrl(
    s3,
    new GetObjectCommand({ Bucket: bucket(), Key: key }),
    { expiresIn: 3600 }
  );
}
