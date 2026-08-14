import type { Metadata } from "next";
import { adminDb } from "@/src/modules/auth/supabase";

type Props = {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { data } = await adminDb().rpc("get_public_profile", {
    requested_slug: slug,
  });
  if (!data)
    return { title: "Página não encontrada", robots: { index: false, follow: false } };
  const description =
    data.bio ||
    `Conheça os serviços de ${data.businessName} e peça um orçamento online.`;
  return {
    title: data.businessName,
    description,
    alternates: { canonical: `/${encodeURIComponent(slug)}` },
    openGraph: {
      type: "website",
      url: `/${encodeURIComponent(slug)}`,
      title: data.businessName,
      description,
    },
  };
}

export default function PublicProviderLayout({ children }: Props) {
  return children;
}
