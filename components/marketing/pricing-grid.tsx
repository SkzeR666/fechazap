import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PLANS } from "@/lib/plans";
import { cn } from "@/lib/utils";

export function PricingGrid({
  ctaPrefix = "/cadastro",
}: {
  ctaPrefix?: string;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {PLANS.map((plan) => (
        <Card
          key={plan.id}
          className={cn(
            "flex flex-col p-6",
            plan.featured && "border-primary shadow-sm",
          )}
        >
          <p className="font-mono text-xs tracking-widest uppercase text-primary">
            {plan.name}
          </p>
          <p className="mt-3 font-heading text-4xl font-semibold">
            {plan.price === 0 ? (
              "R$ 0"
            ) : (
              <>
                <span className="font-mono">R$ {plan.price}</span>
                <span className="text-base font-normal text-muted-foreground">
                  /mês
                </span>
              </>
            )}
          </p>
          <p className="mt-3 text-sm text-muted-foreground">{plan.description}</p>
          <ul className="mt-6 grid flex-1 gap-2 text-sm">
            {plan.features.map((feature) => (
              <li key={feature}>— {feature}</li>
            ))}
          </ul>
          <Button
            asChild
            variant={plan.featured ? "accent" : "outline"}
            className="mt-6 h-11"
          >
            <Link
              href={
                plan.id === "free"
                  ? ctaPrefix
                  : `${ctaPrefix}${ctaPrefix.includes("?") ? "&" : "?"}plano=${plan.id}`
              }
            >
              {plan.cta}
            </Link>
          </Button>
        </Card>
      ))}
    </div>
  );
}
