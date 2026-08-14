import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "node:crypto";
import { platformEnv } from "../modules/platform/env";

export function protectCpf(rawCpf: string) {
  const normalized = rawCpf.replace(/\D/g, "");
  const key = Buffer.from(platformEnv().ACCEPTANCE_ENCRYPTION_KEY, "hex");
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([
    cipher.update(normalized, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return {
    cpfCiphertext: Buffer.concat([iv, tag, encrypted]).toString("base64url"),
    cpfHash: createHash("sha256").update(normalized).digest("hex"),
    cpfLast4: normalized.slice(-4),
  };
}

export function protectSecret(value: string) {
  const key = Buffer.from(platformEnv().ACCEPTANCE_ENCRYPTION_KEY, "hex");
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), encrypted]).toString(
    "base64url",
  );
}

export function unprotectSecret(value: string) {
  const payload = Buffer.from(value, "base64url");
  const decipher = createDecipheriv(
    "aes-256-gcm",
    Buffer.from(platformEnv().ACCEPTANCE_ENCRYPTION_KEY, "hex"),
    payload.subarray(0, 12),
  );
  decipher.setAuthTag(payload.subarray(12, 28));
  return Buffer.concat([
    decipher.update(payload.subarray(28)),
    decipher.final(),
  ]).toString("utf8");
}
