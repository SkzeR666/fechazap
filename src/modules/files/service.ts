import { createHmac } from "node:crypto";
import { filesEnv } from "../platform/env";

type Method = "PUT" | "GET" | "HEAD" | "DELETE";

function signedUrl(
  method: Method,
  key: string,
  contentType: string,
  ttlSeconds: number,
) {
  const config = filesEnv();
  const expires = Math.floor(Date.now() / 1000) + ttlSeconds;
  const signature = createHmac("sha256", config.CLOUDFLARE_FILES_WORKER_SECRET)
    .update(`${method}\n${key}\n${expires}\n${contentType}`)
    .digest("hex");
  const path = key.split("/").map(encodeURIComponent).join("/");
  const url = new URL(`/files/${path}`, config.CLOUDFLARE_FILES_WORKER_URL);
  url.searchParams.set("expires", String(expires));
  url.searchParams.set("signature", signature);
  url.searchParams.set("contentType", contentType);
  return url;
}

export function createUploadUrl(key: string, contentType: string) {
  return signedUrl("PUT", key, contentType, 600).toString();
}

export function createDownloadUrl(key: string) {
  return signedUrl("GET", key, "", 300).toString();
}

export async function fileExists(key: string) {
  const response = await fetch(signedUrl("HEAD", key, "", 60), {
    method: "HEAD",
    cache: "no-store",
  });
  if (response.status === 404) return false;
  if (!response.ok) throw new Error(`files_worker_head_${response.status}`);
  return true;
}

export async function uploadFile(
  key: string,
  body: Uint8Array,
  contentType: string,
) {
  const response = await fetch(signedUrl("PUT", key, contentType, 600), {
    method: "PUT",
    headers: {
      "Content-Type": contentType,
      "Content-Length": String(body.byteLength),
    },
    body: Buffer.from(body),
  });
  if (!response.ok) throw new Error(`files_worker_upload_${response.status}`);
}

export async function deleteFile(key: string) {
  const response = await fetch(signedUrl("DELETE", key, "", 300), {
    method: "DELETE",
  });
  if (!response.ok) throw new Error(`files_worker_delete_${response.status}`);
}
