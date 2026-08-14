"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/src/lib/api/client";
import { useAccessToken } from "@/hooks/use-access-token";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Money } from "@/components/money";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/empty-state";

const EXAMPLES = [
  { name: "Corte e hidratação", priceCents: 12000 },
  { name: "Manutenção elétrica", priceCents: 25000 },
  { name: "Maquiagem para festa", priceCents: 18000 },
];

export default function AppTemplatesPage() {
  const { token, ready } = useAccessToken();
  const services = useQuery({
    queryKey: ["services", token],
    queryFn: () => api.provider.services(token!),
    enabled: ready && Boolean(token),
  });

  if (!ready || services.isLoading) return <Skeleton className="h-64" />;

  const catalog = services.data?.data ?? [];

  return (
    <div className="grid gap-8">
      <div>
        <h1 className="text-2xl font-semibold">Modelos</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Transforme serviços frequentes em fechamentos prontos para enviar.
        </p>
      </div>
      {catalog.length > 0 ? (
        <div className="grid gap-3 md:grid-cols-2">
          {catalog.map((service) => (
            <Card key={service.id} className="p-4">
              <p className="font-medium">{service.name}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {service.price_cents != null ? (
                  <Money cents={service.price_cents} />
                ) : (
                  "Preço na hora"
                )}
              </p>
              <Button asChild variant="accent" className="mt-4">
                <Link href={`/app/novo?servico=${service.id}`}>Usar modelo</Link>
              </Button>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          title="Nenhum serviço para virar modelo"
          body="Cadastre o que você vende e reaproveite no próximo fechamento."
          cta="Cadastrar serviços"
          href="/app/servicos"
        />
      )}
      <div>
        <h2 className="text-lg font-semibold">Exemplos</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Ideias prontas. O assistente de fechamento ainda pode ignorar o
          conteúdo — o botão abre um fechamento novo.
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {EXAMPLES.map((example) => (
            <Card key={example.name} className="p-4">
              <p className="font-medium">{example.name}</p>
              <p className="mt-1">
                <Money cents={example.priceCents} />
              </p>
              <Button asChild variant="outline" className="mt-4">
                <Link href="/app/novo">Usar modelo</Link>
              </Button>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
