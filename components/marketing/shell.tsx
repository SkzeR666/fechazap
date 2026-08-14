import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";

export function MarketingShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <div className="flex-1">{children}</div>
      <SiteFooter />
    </div>
  );
}

export function MarketingCta({
  title,
  href = "/cadastro",
}: {
  title: string;
  href?: string;
}) {
  return (
    <section className="border-t bg-muted/40">
      <div className="mx-auto flex max-w-5xl flex-col items-start gap-4 px-4 py-12 md:flex-row md:items-center md:justify-between">
        <h2 className="max-w-md text-2xl font-semibold">{title}</h2>
        <Button asChild variant="accent" size="lg" className="h-11">
          <Link href={href}>Criar página grátis</Link>
        </Button>
      </div>
    </section>
  );
}
