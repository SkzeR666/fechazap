import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";

const base = process.env.CLOUDFLARE_FILES_WORKER_URL;
const secret =
  process.env.CLOUDFLARE_FILES_WORKER_SECRET ?? process.env.CRON_SECRET;
const run = base && secret ? describe : describe.skip;
const signedUrl = (
  method: string,
  key: string,
  contentType: string,
  expires: number,
) => {
  const signature = createHmac("sha256", secret!)
    .update(`${method}\n${key}\n${expires}\n${contentType}`)
    .digest("hex");
  const url = new URL(
    `/files/${key.split("/").map(encodeURIComponent).join("/")}`,
    base,
  );
  url.searchParams.set("expires", String(expires));
  url.searchParams.set("signature", signature);
  url.searchParams.set("contentType", contentType);
  return url;
};

run("Cloudflare files Worker", () => {
  it("rejects unsigned access and completes a signed file lifecycle", async () => {
    const key = `users/integration/customers/test/quotes/test/pdfs/${Date.now()}.pdf`;
    const expires = Math.floor(Date.now() / 1000) + 300;
    const unsigned = await fetch(new URL(`/files/${key}`, base));
    expect(unsigned.status).toBe(401);
    const body = Buffer.from("%PDF-fechazap-worker");
    const put = await fetch(signedUrl("PUT", key, "application/pdf", expires), {
      method: "PUT",
      headers: {
        "Content-Type": "application/pdf",
        "Content-Length": String(body.length),
      },
      body,
    });
    expect(put.status).toBe(201);
    try {
      const get = await fetch(signedUrl("GET", key, "", expires));
      expect(get.status).toBe(200);
      expect(Buffer.from(await get.arrayBuffer())).toEqual(body);
    } finally {
      const remove = await fetch(signedUrl("DELETE", key, "", expires), {
        method: "DELETE",
      });
      expect(remove.status).toBe(204);
    }
  });
});
