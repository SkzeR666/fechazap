"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/src/lib/api/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Money } from "@/components/money";
import { Skeleton } from "@/components/ui/skeleton";
import { NarrowPage } from "@/components/narrow-page";

export default function PublicStorefront() {
  const { slug } = useParams<{ slug: string }>();
  const {
    data: profile,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["public-profile", slug],
    queryFn: () => api.public.profile(slug),
    enabled: Boolean(slug),
  });

  if (isLoading) {
    return (
      <NarrowPage>
        <Skeleton className="h-10 w-48" />
        <Skeleton className="mt-6 h-24" />
      </NarrowPage>
    );
  }
  if (isError || !profile) {
    return (
      <NarrowPage className="text-center">
        <h1 className="text-2xl font-semibold">Página não encontrada</h1>
      </NarrowPage>
    );
  }

  return (
    <NarrowPage>
      <header className="flex items-center gap-3">
        {profile.logoUrl ? (
          <img
            src={`/api/v1/public/${slug}/logo`}
            alt=""
            className="size-12 rounded-md object-cover"
          />
        ) : (
          <div className="size-12 rounded-md bg-primary/15" />
        )}
        <div>
          <h1 className="text-2xl font-semibold">{profile.businessName}</h1>
          {profile.bio ? (
            <p className="text-sm text-muted-foreground">{profile.bio}</p>
          ) : null}
        </div>
      </header>
      <section className="mt-8 grid gap-3">
        <h2 className="text-sm font-medium text-muted-foreground">Serviços</h2>
        {profile.services.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhum serviço publicado.
          </p>
        ) : (
          profile.services.map((service) => (
            <Card key={service.id} className="p-4">
              <p className="font-medium">{service.name}</p>
              {service.priceCents != null ? (
                <p className="text-sm text-muted-foreground">
                  a partir de <Money cents={service.priceCents} />
                </p>
              ) : null}
            </Card>
          ))
        )}
      </section>
      <Button asChild variant="accent" size="lg" className="mt-8 h-11 w-full">
        <Link href={`/${slug}/orcamento`}>Solicitar atendimento</Link>
      </Button>
      {profile.showBranding ? (
        <p className="mt-8 text-center font-mono text-xs text-muted-foreground">
          Feito com FechaZap
        </p>
      ) : null}
    </NarrowPage>
  );
}
