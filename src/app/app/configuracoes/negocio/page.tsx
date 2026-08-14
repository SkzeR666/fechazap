"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { api } from "@/src/lib/api/client";
import { useAccessToken } from "@/hooks/use-access-token";
import { useProfile } from "@/hooks/use-profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Field } from "@/components/field";
import { slugify } from "@/lib/format";
import { Skeleton } from "@/components/ui/skeleton";
import { useQueryClient } from "@tanstack/react-query";

const MODES = [
  { id: "presencial", label: "Presencial" },
  { id: "cliente", label: "No endereço do cliente" },
  { id: "online", label: "Online" },
] as const;

export default function AppBusinessSettingsPage() {
  const { token } = useAccessToken();
  const profileQuery = useProfile();
  const queryClient = useQueryClient();
  const profile = profileQuery.data?.data;
  const [businessName, setBusinessName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [slug, setSlug] = useState("");
  const [bio, setBio] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [instagram, setInstagram] = useState("");
  const [document, setDocument] = useState("");
  const [address, setAddress] = useState("");
  const [modes, setModes] = useState<string[]>([]);
  const [cancellationPolicy, setCancellationPolicy] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setBusinessName(profile.business_name);
    setDisplayName(profile.display_name ?? "");
    setSlug(profile.slug);
    setBio(profile.bio ?? "");
    setWhatsapp(profile.whatsapp ?? "");
    setInstagram(profile.instagram ?? "");
    setDocument(profile.document ?? "");
    setAddress(profile.address ?? "");
    setModes(profile.service_modes ?? []);
    setCancellationPolicy(profile.cancellation_policy ?? "");
  }, [profile]);

  if (profileQuery.isLoading) return <Skeleton className="h-80" />;

  async function save() {
    if (!token || !profile) return;
    setSaving(true);
    try {
      await api.provider.saveProfile(token, {
        slug: slug || slugify(businessName),
        businessName,
        displayName,
        instagram,
        document,
        address,
        serviceModes: modes as Array<"presencial" | "cliente" | "online">,
        cancellationPolicy,
        bio,
        whatsapp,
        brandColor: profile.brand_color ?? undefined,
        logoUrl: profile.logo_url ?? undefined,
        pixKey: profile.pix_key ?? undefined,
      });
      toast.success("Negócio atualizado.");
      void queryClient.invalidateQueries({ queryKey: ["profile"] });
    } catch {
      toast.error("Não foi possível salvar.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-lg grid gap-4">
      <Button asChild variant="ghost" className="-ml-2 w-fit">
        <Link href="/app/configuracoes">← Configurações</Link>
      </Button>
      <div>
        <h1 className="text-2xl font-semibold">Meu negócio</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Como seus clientes te reconhecem no link.
        </p>
      </div>
      <Field label="Nome do negócio">
        <Input
          value={businessName}
          onChange={(e) => setBusinessName(e.target.value)}
        />
      </Field>
      <Field label="Seu nome">
        <Input
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
        />
      </Field>
      <Field label="Seu link">
        <Input value={slug} onChange={(e) => setSlug(e.target.value)} />
      </Field>
      {slug ? (
        <p className="font-mono text-xs text-muted-foreground">
          fechazap.com/{slug}
        </p>
      ) : null}
      <Field label="WhatsApp">
        <Input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} />
      </Field>
      <Field label="Instagram">
        <Input
          value={instagram}
          onChange={(e) => setInstagram(e.target.value)}
          placeholder="@seuusuario"
        />
      </Field>
      <Field label="CPF/CNPJ">
        <Input
          value={document}
          onChange={(e) => setDocument(e.target.value)}
        />
      </Field>
      <Field label="Descrição">
        <Textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          maxLength={500}
        />
      </Field>
      <Field label="Endereço">
        <Input value={address} onChange={(e) => setAddress(e.target.value)} />
      </Field>
      <Field label="Atendimento">
        <div className="grid gap-2">
          {MODES.map((mode) => (
            <label key={mode.id} className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={modes.includes(mode.id)}
                onCheckedChange={(checked) => {
                  setModes((current) =>
                    checked === true
                      ? [...current, mode.id]
                      : current.filter((item) => item !== mode.id),
                  );
                }}
              />
              {mode.label}
            </label>
          ))}
        </div>
      </Field>
      <Field label="Política de cancelamento">
        <Textarea
          value={cancellationPolicy}
          onChange={(e) => setCancellationPolicy(e.target.value)}
          placeholder="Cancelamentos com menos de 24 horas de antecedência não dão direito à devolução do sinal."
          maxLength={500}
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
    </div>
  );
}
