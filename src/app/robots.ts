import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/dashboard/",
        "/onboarding",
        "/login",
        "/cadastro",
        "/esqueci-senha",
        "/redefinir-senha",
        "/*/o/",
        "/*/orcamento",
      ],
    },
    sitemap: "https://fechazap.vercel.app/sitemap.xml",
    host: "https://fechazap.vercel.app",
  };
}
