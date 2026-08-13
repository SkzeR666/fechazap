import { createCipheriv, createHash, randomBytes } from 'node:crypto';
import { env } from '../config';

export function protectCpf(rawCpf: string) {
  const normalized = rawCpf.replace(/\D/g, '');
  const key = Buffer.from(env().ACCEPTANCE_ENCRYPTION_KEY, 'hex');
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(normalized, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    cpfCiphertext: Buffer.concat([iv, tag, encrypted]).toString('base64url'),
    cpfHash: createHash('sha256').update(normalized).digest('hex'),
    cpfLast4: normalized.slice(-4),
  };
}
