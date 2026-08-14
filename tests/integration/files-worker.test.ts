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
  it("allows browser preflight only from the FechaZap origins", async () => {
    const allowed = await fetch(new URL("/files/preflight", base), {
      method: "OPTIONS",
      headers: {
        Origin: "https://fechazap.vercel.app",
        "Access-Control-Request-Method": "PUT",
        "Access-Control-Request-Headers": "content-type",
      },
    });
    expect(allowed.status).toBe(204);
    expect(allowed.headers.get("access-control-allow-origin")).toBe(
      "https://fechazap.vercel.app",
    );
    expect(allowed.headers.get("access-control-allow-methods")).toContain(
      "PUT",
    );

    const denied = await fetch(new URL("/files/preflight", base), {
      method: "OPTIONS",
      headers: { Origin: "https://example.com" },
    });
    expect(denied.status).toBe(403);
  });

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
        Origin: "https://fechazap.vercel.app",
      },
      body,
    });
    expect(put.status).toBe(201);
    expect(put.headers.get("access-control-allow-origin")).toBe(
      "https://fechazap.vercel.app",
    );
    try {
      const head = await fetch(signedUrl("HEAD", key, "", expires), {
        method: "HEAD",
      });
      expect(head.status).toBe(204);
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

  it("rejects a file whose bytes do not match its declared MIME type", async () => {
    const key = `users/integration/brand/logos/${Date.now()}.png`;
    const expires = Math.floor(Date.now() / 1000) + 300;
    const body = Buffer.from("not-a-png");
    const response = await fetch(
      signedUrl("PUT", key, "image/png", expires),
      {
        method: "PUT",
        headers: {
          "Content-Type": "image/png",
          "Content-Length": String(body.length),
          Origin: "https://fechazap.vercel.app",
        },
        body,
      },
    );
    expect(response.status).toBe(415);
  });
});
