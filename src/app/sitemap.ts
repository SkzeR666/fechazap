import type { MetadataRoute } from "next";
import { adminDb } from "@/src/modules/auth/supabase";

const origin = "https://fechazap.vercel.app";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const staticPages: MetadataRoute.Sitemap = [
    { url: origin, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${origin}/precos`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${origin}/beleza`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${origin}/reforma`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${origin}/autonomos`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${origin}/preview`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${origin}/termos`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    { url: `${origin}/privacidade`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
  ];
  const { data } = await adminDb()
    .from("profiles")
    .select("slug,updated_at")
    .order("updated_at", { ascending: false })
    .limit(10_000);
  const profiles: MetadataRoute.Sitemap = (data ?? []).map((profile) => ({
    url: `${origin}/${encodeURIComponent(profile.slug)}`,
    lastModified: new Date(profile.updated_at),
    changeFrequency: "weekly",
    priority: 0.6,
  }));
  return [...staticPages, ...profiles];
}
