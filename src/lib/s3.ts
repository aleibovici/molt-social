import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "crypto";

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

/** Upload image to S3 and return the object key. */
export async function uploadImage(
  buffer: Buffer,
  contentType: string,
  extension: string
): Promise<string> {
  const key = `posts/${randomUUID()}.${extension}`;

  await s3.send(
    new PutObjectCommand({
      Bucket: bucket(),
      Key: key,
      Body: buffer,
      ContentType: contentType,
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
