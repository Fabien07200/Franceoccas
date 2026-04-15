import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';

const s3 = new S3Client({
  region: process.env.AWS_REGION || 'eu-west-3',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const BUCKET = process.env.S3_BUCKET_MEDIA || 'franceoccas-media-dev';
const CDN = process.env.CLOUDFRONT_DOMAIN || '';

// ─── Upload photo d'annonce ───────────────────────────────────────────────────
export async function uploadListingPhoto(
  buffer: Buffer,
  mimeType: string,
  listingId: string,
  userId: string
): Promise<string> {
  const ext = mimeType.split('/')[1] || 'jpg';
  const key = `listings/${userId}/${listingId}/${uuidv4()}.${ext}`;

  await s3.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: buffer,
    ContentType: mimeType,
    CacheControl: 'public, max-age=31536000',
    Metadata: {
      listingId,
      userId,
      uploadedAt: new Date().toISOString(),
    },
  }));

  return CDN ? `${CDN}/${key}` : `https://${BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
}

// ─── Upload avatar utilisateur ────────────────────────────────────────────────
export async function uploadUserAvatar(
  buffer: Buffer,
  mimeType: string,
  userId: string
): Promise<string> {
  const ext = mimeType.split('/')[1] || 'jpg';
  const key = `avatars/${userId}/avatar-${Date.now()}.${ext}`;

  await s3.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: buffer,
    ContentType: mimeType,
    CacheControl: 'public, max-age=3600',
  }));

  return CDN ? `${CDN}/${key}` : `https://${BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
}

// ─── Upload document KYC/KYB (privé) ─────────────────────────────────────────
export async function uploadPrivateDocument(
  buffer: Buffer,
  mimeType: string,
  userId: string,
  docType: string
): Promise<string> {
  const ext = mimeType.split('/')[1] || 'pdf';
  const key = `private/kyc/${userId}/${docType}-${Date.now()}.${ext}`;

  await s3.send(new PutObjectCommand({
    Bucket: `${BUCKET}-private`,
    Key: key,
    Body: buffer,
    ContentType: mimeType,
    ServerSideEncryption: 'AES256',
  }));

  return key; // Return key only, never public URL for private docs
}

// ─── Génération URL présignée pour accès document privé ──────────────────────
export async function getPrivateDocumentUrl(key: string): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: `${BUCKET}-private`,
    Key: key,
  });

  return getSignedUrl(s3, command, { expiresIn: 3600 }); // 1 hour
}

// ─── Suppression photo ────────────────────────────────────────────────────────
export async function deletePhoto(url: string): Promise<void> {
  let key: string;

  if (url.startsWith(CDN)) {
    key = url.replace(`${CDN}/`, '');
  } else {
    const urlObj = new URL(url);
    key = urlObj.pathname.slice(1);
  }

  await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
}

// ─── Génération URL présignée pour upload direct (frontend) ──────────────────
export async function getPresignedUploadUrl(params: {
  listingId: string;
  userId: string;
  mimeType: string;
  fileSize: number;
}): Promise<{ uploadUrl: string; key: string; publicUrl: string }> {
  if (params.fileSize > 10 * 1024 * 1024) {
    throw new Error('Fichier trop volumineux (max 10 MB)');
  }

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(params.mimeType)) {
    throw new Error('Type de fichier non autorisé');
  }

  const ext = params.mimeType.split('/')[1];
  const key = `listings/${params.userId}/${params.listingId}/${uuidv4()}.${ext}`;

  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ContentType: params.mimeType,
    CacheControl: 'public, max-age=31536000',
    Metadata: { listingId: params.listingId, userId: params.userId },
  });

  const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 300 }); // 5 minutes
  const publicUrl = CDN ? `${CDN}/${key}` : `https://${BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

  return { uploadUrl, key, publicUrl };
}
