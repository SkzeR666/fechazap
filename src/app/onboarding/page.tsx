"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Field } from "@/components/field";
import { useAccessToken } from "@/hooks/use-access-token";
import { useProfile } from "@/hooks/use-profile";
import { BRAND_COLORS, logoUrl, slugify } from "@/lib/format";
import { api } from "@/src/lib/api/client";
import { cn } from "@/lib/utils";

const profileSchema = z.object({
  businessName: z.string().trim().min(2).max(120),
  slug: z.string().regex(/^[a-z0-9][a-z0-9-]{2,47}$/),
});

const serviceSchema = z.object({
  name: z.string().trim().min(2).max(120),
  price: z.string().optional(),
});

export default function OnboardingPage() {
  const router = useRouter();
  const { token, ready } = useAccessToken();
  const profileQuery = useProfile();
  const [step, setStep] = useState(1);
  const [brandColor, setBrandColor] = useState<string>(BRAND_COLORS[0].hex);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [slug, setSlug] = useState("");

  const profileForm = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: { businessName: "", slug: "" },
  });
  const serviceForm = useForm({
    resolver: zodResolver(serviceSchema),
    defaultValues: { name: "", price: "" },
  });

  useEffect(() => {
    if (profileQuery.data?.data?.slug) router.replace("/dashboard");
  }, [profileQuery.data, router]);

  async function saveProfile(values: z.infer<typeof profileSchema>) {
    if (!token) return;
    setSaving(true);
    try {
      let uploadedLogo: string | undefined;
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
        uploadedLogo = `${window.location.origin}${logoUrl(values.slug)}`;
      }
      await api.provider.saveProfile(token, {
        slug: values.slug,
        businessName: values.businessName,
        brandColor,
        logoUrl: uploadedLogo,
      });
      setSlug(values.slug);
      setStep(3);
    } catch {
      toast.error("Não foi possível salvar o perfil.");
    } finally {
      setSaving(false);
    }
  }

  async function saveService(values: z.infer<typeof serviceSchema>) {
    if (!token) return;
    setSaving(true);
    try {
      const cents = values.price
        ? Math.round(Number(values.price.replace(",", ".")) * 100)
        : null;
      await api.provider.createService(token, {
        name: values.name,
        priceCents: Number.isFinite(cents) ? cents : null,
      });
      router.replace("/dashboard");
    } catch {
      toast.error("Não foi possível criar o serviço.");
    } finally {
      setSaving(false);
    }
  }

  if (!ready) return null;

  return (
    <main className="mx-auto min-h-screen max-w-lg px-6 py-12">
      <p className="font-mono text-sm tracking-widest text-primary uppercase">
        Onboarding
      </p>
      <Progress value={step * 33} className="mt-4" />
      <p className="mt-2 font-mono text-xs text-muted-foreground">
        Passo {step} de 3
      </p>

      {step === 1 ? (
        <form
          className="mt-8 grid gap-4"
          onSubmit={profileForm.handleSubmit((values) => {
            setSlug(values.slug);
            setStep(2);
          })}
        >
          <h1 className="text-3xl font-semibold">Perfil</h1>
          <Field
            label="Nome do negócio"
            htmlFor="businessName"
            error={profileForm.formState.errors.businessName?.message}
          >
            <Input
              id="businessName"
              {...profileForm.register("businessName", {
                onChange: (event) => {
                  const generated = slugify(event.target.value);
                  const current = profileForm.getValues("slug");
                  if (
                    !current ||
                    current === slugify(profileForm.getValues("businessName"))
                  ) {
                    profileForm.setValue("slug", generated);
                  }
                },
              })}
            />
          </Field>
          <Field
            label="Seu link"
            htmlFor="slug"
            error={profileForm.formState.errors.slug?.message}
          >
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm text-muted-foreground">
                fechazap.com/
              </span>
              <Input id="slug" {...profileForm.register("slug")} />
            </div>
          </Field>
          <Button type="submit" variant="accent" className="h-11">
            Continuar
          </Button>
        </form>
      ) : null}

      {step === 2 ? (
        <form
          className="mt-8 grid gap-6"
          onSubmit={profileForm.handleSubmit(saveProfile)}
        >
          <h1 className="text-3xl font-semibold">Marca</h1>
          <Field label="Logo">
            <Input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(event) => setLogoFile(event.target.files?.[0] ?? null)}
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
                    brandColor === color.hex
                      ? "border-primary"
                      : "border-border",
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
            type="submit"
            variant="accent"
            className="h-11"
            disabled={saving}
          >
            {saving ? "Salvando..." : "Continuar"}
          </Button>
        </form>
      ) : null}

      {step === 3 ? (
        <div className="mt-8 grid gap-6">
          <h1 className="text-3xl font-semibold">Primeiro serviço</h1>
          <div className="rounded-md border bg-card p-4">
            <p className="text-sm text-muted-foreground">Seu link</p>
            <p className="font-mono text-sm">fechazap.com/{slug}</p>
            <Button
              type="button"
              variant="outline"
              className="mt-3"
              onClick={() => {
                void navigator.clipboard.writeText(
                  `${window.location.origin}/${slug}`,
                );
                toast.success("Link copiado.");
              }}
            >
              Copiar
            </Button>
          </div>
          <form
            className="grid gap-4"
            onSubmit={serviceForm.handleSubmit(saveService)}
          >
            <Field
              label="Nome do serviço"
              htmlFor="name"
              error={serviceForm.formState.errors.name?.message}
            >
              <Input id="name" {...serviceForm.register("name")} />
            </Field>
            <Field label="Preço (opcional)" htmlFor="price">
              <Input
                id="price"
                inputMode="decimal"
                placeholder="1200"
                {...serviceForm.register("price")}
              />
            </Field>
            <Button
              type="submit"
              variant="accent"
              className="h-11"
              disabled={saving}
            >
              {saving ? "Salvando..." : "Concluir"}
            </Button>
          </form>
          <Button variant="ghost" onClick={() => router.replace("/dashboard")}>
            Pular, adiciono depois
          </Button>
        </div>
      ) : null}
    </main>
  );
}
