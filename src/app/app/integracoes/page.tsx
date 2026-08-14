"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAccessToken } from "@/hooks/use-access-token";
import { api } from "@/src/lib/api/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";

export default function AppIntegrationsPage() {
  const { token, ready } = useAccessToken();
  const connection = useQuery({
    queryKey: ["mercado-pago-connection", token],
    queryFn: () => api.provider.mercadoPagoConnection(token!),
    enabled: ready && Boolean(token),
  });

  useEffect(() => {
    const result = new URLSearchParams(window.location.search).get(
      "mercado_pago",
    );
    if (result === "connected") toast.success("Mercado Pago conectado.");
    if (result === "error")
      toast.error("Não foi possível conectar o Mercado Pago.");
  }, []);

  if (!ready || connection.isLoading) return <Skeleton className="h-48" />;
  const connected = connection.data?.connected ?? false;

  async function connect() {
    if (!token) return;
    try {
      const { authorizationUrl } = await api.provider.connectMercadoPago(token);
      window.location.href = authorizationUrl;
    } catch {
      toast.error("Não foi possível iniciar a conexão.");
    }
  }

  async function disconnect() {
    if (!token) return;
    try {
      await api.provider.disconnectMercadoPago(token);
      await connection.refetch();
      toast.success("Mercado Pago desconectado.");
    } catch {
      toast.error("Não foi possível desconectar.");
    }
  }

  return (
    <div className="grid max-w-xl gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Integrações</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Conecte sua conta para receber PIX automático dos seus clientes.
        </p>
      </div>
      <Card className="grid gap-4 p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="font-medium">Mercado Pago</h2>
            <p className="text-sm text-muted-foreground">
              O dinheiro cai diretamente na conta conectada.
            </p>
          </div>
          <Badge variant={connected ? "default" : "secondary"}>
            {connected ? "Conectado" : "Desconectado"}
          </Badge>
        </div>
        {connected ? (
          <>
            <p className="font-mono text-xs text-muted-foreground">
              Conta Mercado Pago {connection.data?.accountId}
            </p>
            <Button variant="outline" onClick={() => void disconnect()}>
              Desconectar
            </Button>
          </>
        ) : (
          <Button variant="accent" onClick={() => void connect()}>
            Conectar Mercado Pago
          </Button>
        )}
      </Card>
      <p className="text-sm text-muted-foreground">
        O PIX manual pela sua chave continua disponível mesmo sem conexão.{" "}
        <Link href="/app/configuracoes/pagamentos" className="underline">
          Editar chave PIX
        </Link>
        .
      </p>
    </div>
  );
}
