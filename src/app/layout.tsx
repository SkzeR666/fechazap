import type { Metadata } from "next";
import { Geist_Mono, IBM_Plex_Mono, Montserrat } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { Providers } from "@/components/providers";
import { cn } from "@/lib/utils";
import "./globals.css";

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-ibm",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://fechazap.vercel.app"),
  title: {
    default: "FechaZap — do orçamento ao serviço fechado. Em um link.",
    template: "%s | FechaZap",
  },
  description:
    "Envie a proposta, receba o aceite, confirme o pagamento e organize o agendamento. O cliente resolve tudo no link, sem criar conta.",
  applicationName: "FechaZap",
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: "FechaZap",
    url: "/",
    title: "FechaZap — do orçamento ao serviço fechado. Em um link.",
    description:
      "Mandou o orçamento. O cliente aceitou. Pagou. Agendou. Tudo pelo mesmo link.",
  },
  twitter: {
    card: "summary_large_image",
    title: "FechaZap — do orçamento ao serviço fechado. Em um link.",
    description:
      "Mandou o orçamento. O cliente aceitou. Pagou. Agendou. Tudo pelo mesmo link.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  category: "business",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="pt-BR"
      suppressHydrationWarning
      className={cn(
        montserrat.variable,
        geistMono.variable,
        ibmPlexMono.variable,
        "font-sans",
      )}
    >
      <body>
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
