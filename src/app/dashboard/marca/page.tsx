"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { api } from "@/src/lib/api/client";
import { useAccessToken } from "@/hooks/use-access-token";
import { useProfile } from "@/hooks/use-profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/field";
import { BRAND_COLORS, logoUrl, slugify } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

export default function BrandPage() {
  const { token } = useAccessToken();
  const profileQuery = useProfile();
  const profile = profileQuery.data?.data;
  const [businessName, setBusinessName] = useState("");
  const [slug, setSlug] = useState("");
  const [bio, setBio] = useState("");
  const [brandColor, setBrandColor] = useState(BRAND_COLORS[0].hex as string);
  const [whatsapp, setWhatsapp] = useState("");
  const [pixKey, setPixKey] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setBusinessName(profile.business_name);
    setSlug(profile.slug);
    setBio(profile.bio ?? "");
    setBrandColor(profile.brand_color ?? BRAND_COLORS[0].hex);
    setWhatsapp(profile.whatsapp ?? "");
    setPixKey(profile.pix_key ?? "");
  }, [profile]);

  if (profileQuery.isLoading) return <Skeleton className="h-80" />;

  async function save() {
    if (!token) return;
    setSaving(true);
    try {
      let uploadedLogo = profile?.logo_url ?? undefined;
      if (logoFile) {
        const contentType = logoFile.type as
          "image/jpeg" | "image/png" | "image/webp";
        const upload = await api.provider.uploadUrl(token, {
          kind: "brand",
          contentType,
          fileName: logoFile.name,
        });
        const put = await fetch(upload.uploadUrl, {
          method: "PUT",
          headers: { "Content-Type": contentType },
          body: logoFile,
        });
        if (!put.ok) throw new Error("upload_failed");
        uploadedLogo = `${window.location.origin}${logoUrl(slug)}`;
      }
      await api.provider.saveProfile(token, {
        slug: slug || slugify(businessName),
        businessName,
        bio,
        brandColor,
        whatsapp,
        pixKey,
        logoUrl: uploadedLogo,
      });
      toast.success("Marca atualizada.");
    } catch {
      toast.error("Não foi possível salvar.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-lg grid gap-4">
      <h1 className="text-2xl font-semibold">Marca</h1>
      <Field label="Nome do negócio">
        <Input
          value={businessName}
          onChange={(e) => setBusinessName(e.target.value)}
        />
      </Field>
      <Field label="Slug">
        <Input value={slug} onChange={(e) => setSlug(e.target.value)} />
      </Field>
      {slug ? (
        <p className="font-mono text-xs text-muted-foreground">
          fechazap.com/{slug}
        </p>
      ) : null}
      <Field label="Bio">
        <Textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          maxLength={500}
        />
      </Field>
      <Field label="WhatsApp">
        <Input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} />
      </Field>
      <Field label="Chave PIX">
        <Input value={pixKey} onChange={(e) => setPixKey(e.target.value)} />
      </Field>
      <Field label="Logo">
        <Input
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={(e) => setLogoFile(e.target.files?.[0] ?? null)}
        />
      </Field>
      <Field label="Cor de destaque">
        <div className="grid grid-cols-4 gap-3">
          {BRAND_COLORS.map((color) => (
            <button
              key={color.hex}
              type="button"
              onClick={() => setBrandColor(color.hex)}
              className={cn(
                "flex flex-col items-center gap-2 rounded-md border p-3",
                brandColor === color.hex ? "border-primary" : "border-border",
              )}
            >
              <span
                className="size-8 rounded-full"
                style={{ background: color.hex }}
              />
              <span className="text-xs">{color.name}</span>
            </button>
          ))}
        </div>
      </Field>
      <Button
        variant="accent"
        className="h-11"
        disabled={saving}
        onClick={save}
      >
        {saving ? "Salvando..." : "Salvar"}
      </Button>
    </div>
  );
}
