import { createHmac } from 'node:crypto';
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
function workerUrl(method: string, key: string, contentType: string, ttl: number) {
  const c = env();
  const base = c.CLOUDFLARE_FILES_WORKER_URL;
  const secret = c.CLOUDFLARE_FILES_WORKER_SECRET ?? c.CRON_SECRET;
  if (!base || !secret) return null;
  const expires = Math.floor(Date.now() / 1000) + ttl;
  const signature = createHmac('sha256', secret).update(`${method}\n${key}\n${expires}\n${contentType}`).digest('hex');
  const path = key.split('/').map(encodeURIComponent).join('/');
  const url = new URL(`/files/${path}`, base);
  url.searchParams.set('expires', String(expires));
  url.searchParams.set('signature', signature);
  url.searchParams.set('contentType', contentType);
  return url.toString();
}
export function fileUploadUrl(key: string, contentType: string) { return workerUrl('PUT', key, contentType, 600); }
export function fileDownloadUrl(key: string) { return workerUrl('GET', key, '', 300); }
export async function putFile(key: string, body: Uint8Array, contentType: string) {
  const c = settings();
  await client().send(new PutObjectCommand({ Bucket: c.CLOUDFLARE_R2_BUCKET, Key: key, Body: body, ContentType: contentType }));
}
export async function deleteFile(key: string) {
  const c = settings();
  await client().send(new DeleteObjectCommand({ Bucket: c.CLOUDFLARE_R2_BUCKET, Key: key }));
}
