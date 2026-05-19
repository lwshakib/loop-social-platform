import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Initialize the AWS S3 Client for Cloudflare R2
const s3 = new S3Client({
  region: process.env.AWS_REGION || 'auto',
  endpoint: process.env.AWS_ENDPOINT,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

/**
 * Generates a presigned URL for uploading a file (HTTP PUT)
 * @param key The S3 object key (path inside the bucket)
 * @param contentType The MIME type of the file
 * @returns Presigned upload URL valid for 10 minutes
 */
export async function getUploadPresignedUrl(key: string, contentType: string): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: key,
    ContentType: contentType,
  });

  return await getSignedUrl(s3, command, { expiresIn: 600 });
}

/**
 * Generates a signed URL for reading/downloading a file (HTTP GET)
 * @param key The S3 object key
 * @returns Signed download URL valid for 1 hour
 */
export async function getDownloadSignedUrl(key: string): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: key,
  });

  return await getSignedUrl(s3, command, { expiresIn: 3600 });
}

/**
 * Automatically detects if the provided string is a raw S3 key/path or a full external URL.
 * If it is an S3 key, it returns a signed URL. Otherwise, it returns the URL as-is.
 * @param urlOrKey The S3 key or full HTTP(S) URL
 * @returns Resolved HTTP(S) URL or null
 */
export async function getSignedUrlIfNeeded(
  urlOrKey: string | null | undefined
): Promise<string | null> {
  if (!urlOrKey) return null;

  // If it's a full absolute URL (e.g. Google OAuth avatar, external link), return as-is
  if (urlOrKey.startsWith('http://') || urlOrKey.startsWith('https://')) {
    return urlOrKey;
  }

  try {
    return await getDownloadSignedUrl(urlOrKey);
  } catch (error) {
    console.error(`Error generating signed URL for key ${urlOrKey}:`, error);
    return null;
  }
}
