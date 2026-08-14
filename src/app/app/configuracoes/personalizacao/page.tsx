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
import { BRAND_COLORS, logoUrl } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { useQueryClient } from "@tanstack/react-query";

export default function AppPersonalizationPage() {
  const { token } = useAccessToken();
  const profileQuery = useProfile();
  const queryClient = useQueryClient();
  const profile = profileQuery.data?.data;
  const [brandColor, setBrandColor] = useState(BRAND_COLORS[0].hex as string);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setBrandColor(profile.brand_color ?? BRAND_COLORS[0].hex);
  }, [profile]);

  if (profileQuery.isLoading) return <Skeleton className="h-80" />;

  async function save() {
    if (!token || !profile) return;
    setSaving(true);
    try {
      let uploadedLogo = profile.logo_url ?? undefined;
      if (logoFile) {
        const contentType = logoFile.type as
          | "image/jpeg"
          | "image/png"
          | "image/webp";
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
        await api.provider.confirmUpload(token, upload.upload);
        uploadedLogo = `${window.location.origin}${logoUrl(profile.slug)}`;
      }
      await api.provider.saveProfile(token, {
        slug: profile.slug,
        businessName: profile.business_name,
        bio: profile.bio ?? undefined,
        whatsapp: profile.whatsapp ?? undefined,
        pixKey: profile.pix_key ?? undefined,
        brandColor,
        logoUrl: uploadedLogo,
      });
      toast.success("Personalização atualizada.");
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
      <h1 className="text-2xl font-semibold">Personalização</h1>
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
        onClick={() => void save()}
      >
        {saving ? "Salvando..." : "Salvar"}
      </Button>
    </div>
  );
}
