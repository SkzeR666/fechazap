"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { api, ApiError } from "@/src/lib/api/client";
import { useAccessToken } from "@/hooks/use-access-token";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/field";
import { Skeleton } from "@/components/ui/skeleton";
import { PLANS } from "@/lib/plans";
import { cn } from "@/lib/utils";

export default function SubscriptionPage() {
  const { token, email: accountEmail, ready } = useAccessToken();
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState<"solo" | "pro" | "cancel" | null>(
    null,
  );
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

  useEffect(() => {
    if (accountEmail) setEmail((current) => current || accountEmail);
  }, [accountEmail]);

  if (!ready || profile.isLoading || subscription.isLoading) {
    return <Skeleton className="h-40" />;
  }

  const plan = profile.data?.data?.plan ?? "free";
  const status = subscription.data?.data?.status;

  async function checkout(next: "solo" | "pro") {
    if (!token) return;
    if (!email.includes("@")) {
      toast.error("Informe o e-mail do pagador.");
      return;
    }
    setPending(next);
    try {
      const result = await api.provider.subscribe(token, {
        plan: next,
        payerEmail: email,
      });
      window.location.href = result.checkoutUrl;
    } catch (error) {
      toast.error(
        error instanceof ApiError && error.body.detail
          ? error.body.detail
          : "Não foi possível abrir o checkout.",
      );
      setPending(null);
    }
  }

  async function cancel() {
    if (!token) return;
    setPending("cancel");
    try {
      await api.provider.cancelSubscription(token);
      toast.success("Assinatura cancelada.");
      await subscription.refetch();
      await profile.refetch();
    } catch {
      toast.error("Não foi possível cancelar.");
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="grid max-w-3xl gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Assinatura</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Plano atual: <span className="font-mono uppercase">{plan}</span>
          {status ? (
            <Badge className="ml-2" variant="secondary">
              {status}
            </Badge>
          ) : null}
        </p>
      </div>
      <Field label="E-mail do pagador (Mercado Pago)">
        <Input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="voce@email.com"
        />
      </Field>
      <p className="-mt-4 text-xs text-muted-foreground">
        Para testar uma compra, use uma conta Mercado Pago diferente da conta
        vendedora.
      </p>
      <div className="grid gap-4 md:grid-cols-3">
        {PLANS.map((item) => (
          <Card
            key={item.id}
            className={cn(
              "flex flex-col p-4",
              item.id === plan && "border-primary",
            )}
          >
            <p className="font-mono text-xs uppercase text-primary">
              {item.name}
            </p>
            <p className="mt-2 font-heading text-2xl">
              {item.price === 0 ? "R$ 0" : `R$ ${item.price}`}
            </p>
            <ul className="mt-3 grid flex-1 gap-1 text-sm text-muted-foreground">
              {item.features.map((feature) => (
                <li key={feature}>— {feature}</li>
              ))}
            </ul>
            {item.id === "free" ? (
              <p className="mt-4 text-xs text-muted-foreground">
                Plano inicial
              </p>
            ) : (
              <Button
                className="mt-4"
                variant={item.featured ? "accent" : "outline"}
                disabled={pending !== null || item.id === plan}
                onClick={() => void checkout(item.id)}
              >
                {item.id === plan
                  ? "Atual"
                  : pending === item.id
                    ? "Abrindo..."
                    : item.cta}
              </Button>
            )}
          </Card>
        ))}
      </div>
      {status && status !== "cancelled" ? (
        <Button variant="ghost" disabled={pending !== null} onClick={cancel}>
          {pending === "cancel" ? "Cancelando..." : "Cancelar assinatura"}
        </Button>
      ) : null}
    </div>
  );
}
