import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { env } from '../config';

function settings() {
  const c = env();
  if (!c.CLOUDFLARE_R2_ENDPOINT || !c.CLOUDFLARE_R2_BUCKET || !c.CLOUDFLARE_R2_ACCESS_KEY_ID || !c.CLOUDFLARE_R2_SECRET_ACCESS_KEY) throw new Error('r2_not_configured');
  return c;
}
function client() {
  const c = settings();
  return new S3Client({ region: 'auto', endpoint: c.CLOUDFLARE_R2_ENDPOINT, credentials: { accessKeyId: c.CLOUDFLARE_R2_ACCESS_KEY_ID!, secretAccessKey: c.CLOUDFLARE_R2_SECRET_ACCESS_KEY! } });
}
export async function signedUpload(key: string, contentType: string) {
  const c = settings();
  return getSignedUrl(client(), new PutObjectCommand({ Bucket: c.CLOUDFLARE_R2_BUCKET, Key: key, ContentType: contentType }), { expiresIn: 600 });
}
export async function signedDownload(key: string) {
  const c = settings();
  return getSignedUrl(client(), new GetObjectCommand({ Bucket: c.CLOUDFLARE_R2_BUCKET, Key: key }), { expiresIn: 300 });
}
export async function putFile(key: string, body: Uint8Array, contentType: string) {
  const c = settings();
  await client().send(new PutObjectCommand({ Bucket: c.CLOUDFLARE_R2_BUCKET, Key: key, Body: body, ContentType: contentType }));
}
export async function deleteFile(key: string) {
  const c = settings();
  await client().send(new DeleteObjectCommand({ Bucket: c.CLOUDFLARE_R2_BUCKET, Key: key }));
}
