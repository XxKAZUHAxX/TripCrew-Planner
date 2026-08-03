import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { customAlphabet } from 'nanoid';

// Cloudflare R2 is S3-compatible. All secrets come from the environment and are
// NEVER committed. Required env vars:
//   R2_ENDPOINT           e.g. https://<accountid>.r2.cloudflarestorage.com
//   R2_ACCESS_KEY_ID      R2 API token access key id
//   R2_SECRET_ACCESS_KEY  R2 API token secret
//   R2_BUCKET             e.g. tripcrewplanner
//   R2_PUBLIC_BASE_URL    public bucket URL (r2.dev or a custom domain), no trailing slash
const nanoid = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyz', 16);

// Allowed image types → file extension for the stored object key.
const EXT_BY_MIME: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
};

export const ALLOWED_IMAGE_MIMES = Object.keys(EXT_BY_MIME);
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB

let client: S3Client | null = null;

export function isStorageConfigured(): boolean {
    return Boolean(
        process.env.R2_ENDPOINT &&
        process.env.R2_ACCESS_KEY_ID &&
        process.env.R2_SECRET_ACCESS_KEY &&
        process.env.R2_BUCKET &&
        process.env.R2_PUBLIC_BASE_URL
    );
}

function getClient(): S3Client {
    if (!client) {
        client = new S3Client({
            region: 'auto',
            endpoint: process.env.R2_ENDPOINT,
            credentials: {
                accessKeyId: process.env.R2_ACCESS_KEY_ID as string,
                secretAccessKey: process.env.R2_SECRET_ACCESS_KEY as string,
            },
        });
    }
    return client;
}

export interface StoredImage {
    key: string;
    url: string;
}

// Uploads a single image buffer to R2 and returns its object key + public URL.
export async function uploadImage(
    destId: string,
    buffer: Buffer,
    contentType: string
): Promise<StoredImage> {
    const ext = EXT_BY_MIME[contentType] ?? 'bin';
    const key = `destinations/${destId}/${nanoid()}.${ext}`;
    await getClient().send(
        new PutObjectCommand({
            Bucket: process.env.R2_BUCKET,
            Key: key,
            Body: buffer,
            ContentType: contentType,
        })
    );
    const base = (process.env.R2_PUBLIC_BASE_URL as string).replace(/\/$/, '');
    return { key, url: `${base}/${key}` };
}

// Best-effort removal; a failed delete should not block the API response.
export async function deleteImage(key: string): Promise<void> {
    await getClient().send(new DeleteObjectCommand({ Bucket: process.env.R2_BUCKET, Key: key }));
}
