/* global TextEncoder, crypto, Response, URL, Headers */
const allowedTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
]);
const encoder = new TextEncoder();
const hex = (bytes) =>
  [...new Uint8Array(bytes)]
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("");
async function signature(secret, value) {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return hex(await crypto.subtle.sign("HMAC", key, encoder.encode(value)));
}
function equal(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let index = 0; index < a.length; index++)
    diff |= a.charCodeAt(index) ^ b.charCodeAt(index);
  return diff === 0;
}
const json = (body, status) =>
  Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/health")
      return json({ ok: true, service: "fechazap-files" }, 200);
    if (!url.pathname.startsWith("/files/"))
      return json({ error: "not_found" }, 404);
    const key = decodeURIComponent(url.pathname.slice(7));
    const expires = Number(url.searchParams.get("expires"));
    const provided = url.searchParams.get("signature") ?? "";
    const contentType = url.searchParams.get("contentType") ?? "";
    if (
      !key.startsWith("users/") ||
      !Number.isFinite(expires) ||
      expires < Math.floor(Date.now() / 1000)
    )
      return json({ error: "invalid_or_expired" }, 401);
    const expected = await signature(
      env.FILES_SIGNING_SECRET,
      `${request.method}\n${key}\n${expires}\n${contentType}`,
    );
    if (!equal(expected, provided))
      return json({ error: "invalid_signature" }, 401);
    if (request.method === "PUT") {
      const length = Number(request.headers.get("content-length") ?? 0);
      if (
        !allowedTypes.has(contentType) ||
        length <= 0 ||
        length > 15 * 1024 * 1024
      )
        return json({ error: "invalid_file" }, 413);
      await env.FILES.put(key, request.body, { httpMetadata: { contentType } });
      return json({ ok: true }, 201);
    }
    if (request.method === "GET") {
      const object = await env.FILES.get(key);
      if (!object) return json({ error: "not_found" }, 404);
      const headers = new Headers();
      object.writeHttpMetadata(headers);
      headers.set("ETag", object.httpEtag);
      headers.set("Cache-Control", "private, max-age=300");
      return new Response(object.body, { headers });
    }
    if (request.method === "DELETE") {
      await env.FILES.delete(key);
      return new Response(null, { status: 204 });
    }
    return json({ error: "method_not_allowed" }, 405);
  },
};
