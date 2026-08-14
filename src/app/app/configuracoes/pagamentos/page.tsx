"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { api } from "@/src/lib/api/client";
import { useAccessToken } from "@/hooks/use-access-token";
import { useProfile } from "@/hooks/use-profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/field";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { useQueryClient } from "@tanstack/react-query";

export default function AppPaymentsSettingsPage() {
  const { token } = useAccessToken();
  const profileQuery = useProfile();
  const queryClient = useQueryClient();
  const profile = profileQuery.data?.data;
  const [pixKey, setPixKey] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setPixKey(profile.pix_key ?? "");
  }, [profile]);

  if (profileQuery.isLoading) return <Skeleton className="h-64" />;

  async function save() {
    if (!token || !profile) return;
    setSaving(true);
    try {
      await api.provider.saveProfile(token, {
        slug: profile.slug,
        businessName: profile.business_name,
        bio: profile.bio ?? undefined,
        brandColor: profile.brand_color ?? undefined,
        logoUrl: profile.logo_url ?? undefined,
        whatsapp: profile.whatsapp ?? undefined,
        pixKey,
      });
      toast.success("Chave PIX atualizada.");
      void queryClient.invalidateQueries({ queryKey: ["profile"] });
    } catch {
      toast.error("Não foi possível salvar.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-lg grid gap-6">
      <Button asChild variant="ghost" className="-ml-2 w-fit">
        <Link href="/app/configuracoes">← Configurações</Link>
      </Button>
      <h1 className="text-2xl font-semibold">Pagamentos</h1>
      <Field label="Chave PIX">
        <Input
          value={pixKey}
          onChange={(e) => setPixKey(e.target.value)}
          placeholder="CPF, CNPJ, e-mail, telefone ou chave aleatória"
        />
      </Field>
      <Button
        variant="accent"
        className="h-11"
        disabled={saving}
        onClick={() => void save()}
      >
        {saving ? "Salvando..." : "Salvar"}
      </Button>
      <Card className="p-4">
        <p className="font-medium">PIX automático</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Conecte o Mercado Pago para o cliente pagar sem você confirmar na mão.
        </p>
        <Button asChild variant="outline" className="mt-4">
          <Link href="/app/integracoes">Abrir integrações</Link>
        </Button>
      </Card>
    </div>
  );
}
