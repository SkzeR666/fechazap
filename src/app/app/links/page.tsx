"use client";

import Link from "next/link";
import { toast } from "sonner";
import { api } from "@/src/lib/api/client";
import { useAccessToken } from "@/hooks/use-access-token";
import { useProfile } from "@/hooks/use-profile";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Money } from "@/components/money";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/empty-state";
import { publicStorefrontUrl } from "@/lib/format";

export default function AppLinksPage() {
  const { token, ready } = useAccessToken();
  const profileQuery = useProfile();
  const services = useQuery({
    queryKey: ["services", token],
    queryFn: () => api.provider.services(token!),
    enabled: ready && Boolean(token),
  });
  const profile = profileQuery.data?.data;

  if (!ready || profileQuery.isLoading || services.isLoading) {
    return <Skeleton className="h-64" />;
  }

  const slug = profile?.slug;
  const url = slug ? publicStorefrontUrl(slug) : null;
  const catalog = services.data?.data ?? [];

  return (
    <div className="grid max-w-2xl gap-8">
      <div>
        <h1 className="text-2xl font-semibold">Links</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Link permanente: o endereço da sua página pública. Quem pedir
          atendimento aparece em Solicitações.
        </p>
      </div>
      {url ? (
        <Card className="gap-4 p-4">
          <p className="text-sm text-muted-foreground">Link permanente</p>
          <p className="font-mono text-sm break-all">{url}</p>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="accent"
              onClick={() => {
                void navigator.clipboard.writeText(url);
                toast.success("Link copiado.");
              }}
            >
              Copiar
            </Button>
            <Button asChild variant="outline">
              <Link href={`/${slug}`} target="_blank">
                Página pública
              </Link>
            </Button>
            <Button asChild variant="ghost">
              <Link href="/app/solicitacoes">Solicitações</Link>
            </Button>
          </div>
        </Card>
      ) : (
        <EmptyState
          title="Sua página ainda não tem slug"
          body="Termine o cadastro do negócio para gerar o link permanente."
          cta="Configurar negócio"
          href="/app/configuracoes/negocio"
        />
      )}
      <div>
        <h2 className="text-lg font-semibold">Serviços na página</h2>
        {catalog.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              title="Nenhum serviço na vitrine"
              body="O que você cadastrar em Serviços aparece no seu link."
              cta="Cadastrar serviços"
              href="/app/servicos"
            />
          </div>
        ) : (
          <div className="mt-4 grid gap-3">
            {catalog.map((service) => (
              <Card key={service.id} className="p-4">
                <p className="font-medium">{service.name}</p>
                <p className="text-sm text-muted-foreground">
                  {service.price_cents != null ? (
                    <Money cents={service.price_cents} />
                  ) : (
                    "A combinar"
                  )}
                </p>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
