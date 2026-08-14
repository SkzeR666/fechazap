import type { NextConfig } from "next";

const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://fechazap-files.projectcore.workers.dev",
  "font-src 'self' data:",
  "connect-src 'self' https://tdohxuldlfeyenmwyirx.supabase.co wss://tdohxuldlfeyenmwyirx.supabase.co https://*.vercel-insights.com",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  "media-src 'none'",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
  {
    key: "Permissions-Policy",
    value:
      "camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async redirects() {
    return [
      { source: "/login", destination: "/entrar", permanent: false },
      { source: "/cadastro", destination: "/criar-conta", permanent: false },
      {
        source: "/esqueci-senha",
        destination: "/recuperar-senha",
        permanent: false,
      },
      {
        source: "/dashboard/orcamentos/novo",
        destination: "/app/novo",
        permanent: false,
      },
      {
        source: "/dashboard/orcamentos/:id",
        destination: "/app/fechamentos/:id",
        permanent: false,
      },
      { source: "/dashboard", destination: "/app", permanent: false },
      {
        source: "/dashboard/:path*",
        destination: "/app/:path*",
        permanent: false,
      },
    ];
  },
  async headers() {
    return [
      { source: "/(.*)", headers: securityHeaders },
      {
        source: "/api/(.*)",
        headers: [
          { key: "Cache-Control", value: "no-store, max-age=0" },
          { key: "X-Robots-Tag", value: "noindex, nofollow, nosnippet" },
        ],
      },
      {
        source:
          "/:path(app|dashboard|onboarding|entrar|criar-conta|recuperar-senha|login|cadastro|esqueci-senha|redefinir-senha)(.*)",
        headers: [
          { key: "Cache-Control", value: "private, no-store, max-age=0" },
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
        ],
      },
      {
        source: "/f(.*)",
        headers: [
          { key: "Cache-Control", value: "private, no-store, max-age=0" },
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
        ],
      },
    ];
  },
};
export default nextConfig;
