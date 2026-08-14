export const BRAND_COLORS = [
  { hex: "#0E6B4F", name: "Verde" },
  { hex: "#1E4A6B", name: "Petróleo" },
  { hex: "#6B3E1E", name: "Terra" },
  { hex: "#4A3B6B", name: "Uva" },
] as const;

function appOrigin() {
  if (typeof window !== "undefined") return window.location.origin;
  return process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL ?? "";
}

export function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

export function publicStorefrontUrl(slug: string, origin = appOrigin()) {
  return `${origin.replace(/\/$/, "")}/${slug}`;
}

export function publicQuoteUrl(slug: string, token: string, origin = appOrigin()) {
  return `${publicStorefrontUrl(slug, origin)}/o/${token}`;
}

export function logoUrl(slug: string) {
  return `/api/v1/public/${encodeURIComponent(slug)}/logo`;
}

export function one<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

export function reaisToCents(value: string) {
  const normalized = value
    .replace(/\s/g, "")
    .replace(/\./g, "")
    .replace(",", ".");
  const amount = Number(normalized);
  if (!Number.isFinite(amount) || amount < 0) return null;
  return Math.round(amount * 100);
}
