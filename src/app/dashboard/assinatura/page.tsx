"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/src/lib/api/client";
import { useAccessToken } from "@/hooks/use-access-token";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export default function SubscriptionPage() {
  const { token, ready } = useAccessToken();
  const profile = useQuery({
    queryKey: ["profile", token],
    queryFn: () => api.provider.profile(token!),
    enabled: ready && Boolean(token),
  });
  const subscription = useQuery({
    queryKey: ["subscription", token],
    queryFn: () => api.provider.subscription(token!),
    enabled: ready && Boolean(token),
  });

  if (!ready || profile.isLoading || subscription.isLoading) {
    return <Skeleton className="h-40" />;
  }

  const plan = profile.data?.data?.plan ?? "free";
  const status = subscription.data?.data?.status;

  return (
    <div className="max-w-lg grid gap-4">
      <h1 className="text-2xl font-semibold">Assinatura</h1>
      <Card className="p-6">
        <p className="text-sm text-muted-foreground">Plano atual</p>
        <p className="mt-1 font-heading text-3xl uppercase">{plan}</p>
        {status ? <Badge className="mt-3">{status}</Badge> : null}
        <p className="mt-4 text-sm text-muted-foreground">
          Upgrade e cobrança automática entram na próxima etapa. Por enquanto o
          plano é acompanhado manualmente.
        </p>
      </Card>
    </div>
  );
}
