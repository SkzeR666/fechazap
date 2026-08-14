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
import { whatsappUrl } from "@/src/lib/whatsapp";
import { cn } from "@/lib/utils";

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

  const accent = profile.brandColor || "#EAB308";
  const wa = profile.whatsapp
    ? whatsappUrl(
        profile.whatsapp,
        `Olá, ${profile.businessName}! Vi sua página e quero agendar um horário.`,
      )
    : null;

  return (
    <div
      className="min-h-screen bg-background"
      style={{ ["--store-accent" as string]: accent }}
    >
      <div
        className="h-2 w-full"
        style={{ background: "var(--store-accent)" }}
      />
      <NarrowPage>
        <header className="flex items-start gap-4">
          {profile.logoUrl ? (
            <img
              src={`/api/v1/public/${slug}/logo`}
              alt=""
              className="size-16 rounded-xl object-cover"
            />
          ) : (
            <div
              className="flex size-16 items-center justify-center rounded-xl text-lg font-semibold text-black"
              style={{ background: "var(--store-accent)" }}
            >
              {profile.businessName.slice(0, 1).toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <h1 className="text-3xl font-semibold">{profile.businessName}</h1>
            {profile.bio ? (
              <p className="mt-2 text-muted-foreground">{profile.bio}</p>
            ) : (
              <p className="mt-2 text-muted-foreground">
                Escolha o serviço e solicite atendimento. Sem criar conta.
              </p>
            )}
          </div>
        </header>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button asChild variant="accent" size="lg" className="h-11">
            <Link href={`/${slug}/orcamento`}>Solicitar atendimento</Link>
          </Button>
          {wa ? (
            <Button asChild variant="outline" size="lg" className="h-11">
              <a href={wa} target="_blank" rel="noreferrer">
                WhatsApp
              </a>
            </Button>
          ) : null}
        </div>

        <section className="mt-10 grid gap-3">
          <h2 className="text-sm font-medium text-muted-foreground">
            Serviços
          </h2>
          {profile.services.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhum serviço publicado ainda. Use o botão acima para pedir um
              horário.
            </p>
          ) : (
            profile.services.map((service) => (
              <Card key={service.id} className="gap-3 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium">{service.name}</p>
                    {service.description ? (
                      <p className="mt-1 text-sm text-muted-foreground">
                        {service.description}
                      </p>
                    ) : null}
                    {service.priceCents != null ? (
                      <p className="mt-2 text-sm text-muted-foreground">
                        a partir de <Money cents={service.priceCents} />
                      </p>
                    ) : (
                      <p className="mt-2 text-sm text-muted-foreground">
                        Valor a combinar
                      </p>
                    )}
                  </div>
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/${slug}/orcamento?servico=${service.id}`}>
                      Pedir
                    </Link>
                  </Button>
                </div>
              </Card>
            ))
          )}
        </section>

        <Button
          asChild
          variant="accent"
          size="lg"
          className={cn("mt-8 h-11 w-full")}
        >
          <Link href={`/${slug}/orcamento`}>Solicitar atendimento</Link>
        </Button>
        {profile.showBranding ? (
          <p className="mt-8 text-center font-mono text-xs text-muted-foreground">
            Feito com FechaZap
          </p>
        ) : null}
      </NarrowPage>
    </div>
  );
}
