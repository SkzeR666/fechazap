import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { cn, appFrame } from "@/lib/utils";

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
  description = "Crie sua proposta, envie o link e acompanhe o cliente até o atendimento.",
  href = "/criar-conta",
}: {
  title: string;
  description?: string;
  href?: string;
}) {
  return (
    <section className="border-t bg-muted/40">
      <div
        className={cn(
          appFrame,
          "flex flex-col items-start gap-4 py-12 md:flex-row md:items-center md:justify-between",
        )}
      >
        <div className="max-w-xl">
          <h2 className="text-2xl font-semibold">{title}</h2>
          <p className="mt-2 text-muted-foreground">{description}</p>
        </div>
        <Button asChild variant="accent" size="lg" className="h-11">
          <Link href={href}>Começar grátis</Link>
        </Button>
      </div>
    </section>
  );
}
