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
import { appFrame, cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";
import { useQueryClient } from "@tanstack/react-query";

const profileSchema = z.object({
  businessName: z.string().trim().min(2).max(120),
  displayName: z.string().trim().max(120).optional(),
  slug: z.string().regex(/^[a-z0-9][a-z0-9-]{2,47}$/),
  whatsapp: z.string().trim().min(8).max(30),
});

const chargeSchema = z.object({
  pixKey: z.string().trim().min(3).max(180),
});

const serviceSchema = z.object({
  name: z.string().trim().min(2).max(120),
  price: z.string().optional(),
});

const NICHES = [
  { id: "beleza", label: "Beleza" },
  { id: "fotografia", label: "Fotografia" },
  { id: "eventos", label: "Eventos" },
  { id: "manutencao", label: "Manutenção" },
  { id: "consultoria", label: "Consultoria" },
  { id: "aulas", label: "Aulas" },
  { id: "residenciais", label: "Serviços residenciais" },
  { id: "outro", label: "Outro" },
] as const;

export default function OnboardingPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { token, ready } = useAccessToken();
  const profileQuery = useProfile();
  const [step, setStep] = useState(1);
  const [brandColor, setBrandColor] = useState<string>(BRAND_COLORS[0].hex);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [slug, setSlug] = useState("");
  const [niche, setNiche] = useState<string | null>(null);
  const [chargeMode, setChargeMode] = useState<string>("depends");

  const profileForm = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: { businessName: "", displayName: "", slug: "", whatsapp: "" },
  });
  const chargeForm = useForm({
    resolver: zodResolver(chargeSchema),
    defaultValues: { pixKey: "" },
  });
  const serviceForm = useForm({
    resolver: zodResolver(serviceSchema),
    defaultValues: { name: "", price: "" },
  });

  useEffect(() => {
    if (step !== 1) return;
    if (profileQuery.data?.data?.slug) router.replace("/app");
  }, [profileQuery.data, router, step]);

  async function saveProfile(pixKey?: string) {
    if (!token) return false;
    const values = profileForm.getValues();
    setSaving(true);
    try {
      let uploadedLogo: string | undefined;
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
        uploadedLogo = `${window.location.origin}${logoUrl(values.slug)}`;
      }
      await api.provider.saveProfile(token, {
        slug: values.slug,
        businessName: values.businessName,
        displayName: values.displayName,
        brandColor,
        logoUrl: uploadedLogo,
        whatsapp: values.whatsapp,
        pixKey,
      });
      setSlug(values.slug);
      await queryClient.invalidateQueries({ queryKey: ["profile"] });
      return true;
    } catch {
      toast.error("Não foi possível salvar o perfil.");
      return false;
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
      setStep(4);
    } catch {
      toast.error("Não foi possível criar o serviço.");
    } finally {
      setSaving(false);
    }
  }

  if (!ready) return null;

  return (
    <main className="min-h-screen">
      <div className={cn(appFrame, "flex items-center justify-between py-4")}>
        <p className="font-heading text-lg font-semibold">FechaZap</p>
        <ThemeToggle />
      </div>
      <div className={appFrame}>
        <div className="max-w-lg pb-12">
          <p className="font-mono text-sm tracking-widest text-primary uppercase">
            Onboarding
          </p>
          <Progress value={step * 20} className="mt-4" />
          <p className="mt-2 font-mono text-xs text-muted-foreground">
            Passo {step} de 5
          </p>

          {step === 1 ? (
            <div className="mt-8 grid gap-6">
              <h1 className="text-3xl font-semibold">
                Vamos preparar seu FechaZap
              </h1>
              <p className="text-muted-foreground">
                Leva menos de dois minutos.
              </p>
              <Button
                variant="accent"
                className="h-11"
                onClick={() => setStep(2)}
              >
                Começar
              </Button>
            </div>
          ) : null}

          {step === 2 ? (
            <form
              className="mt-8 grid gap-4"
              onSubmit={profileForm.handleSubmit((values) => {
                setSlug(values.slug);
                setStep(3);
              })}
            >
              <h1 className="text-3xl font-semibold">
                Como seus clientes te conhecem?
              </h1>
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
                        current ===
                          slugify(profileForm.getValues("businessName"))
                      ) {
                        profileForm.setValue("slug", generated);
                      }
                    },
                  })}
                />
              </Field>
              <Field
                label="Seu nome"
                htmlFor="displayName"
                error={profileForm.formState.errors.displayName?.message}
              >
                <Input
                  id="displayName"
                  {...profileForm.register("displayName")}
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
              <Field
                label="WhatsApp comercial"
                htmlFor="whatsapp"
                error={profileForm.formState.errors.whatsapp?.message}
              >
                <Input
                  id="whatsapp"
                  inputMode="tel"
                  placeholder="5511999999999"
                  {...profileForm.register("whatsapp")}
                />
              </Field>
              <Field label="Logo">
                <Input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(event) =>
                    setLogoFile(event.target.files?.[0] ?? null)
                  }
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
              <Button type="submit" variant="accent" className="h-11">
                Continuar
              </Button>
              <Button type="button" variant="ghost" onClick={() => setStep(1)}>
                Voltar
              </Button>
            </form>
          ) : null}

          {step === 3 ? (
            <div className="mt-8 grid gap-6">
              <h1 className="text-3xl font-semibold">O que você vende?</h1>
              <Field label="Nicho (opcional)">
                <div className="grid gap-2">
                  {NICHES.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setNiche(item.id)}
                      className={cn(
                        "rounded-md border px-3 py-2 text-left text-sm",
                        niche === item.id
                          ? "border-primary"
                          : "border-border",
                      )}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </Field>
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
                  {saving ? "Salvando..." : "Continuar"}
                </Button>
              </form>
              <Button variant="ghost" onClick={() => setStep(4)}>
                Pular, adiciono depois
              </Button>
              <Button variant="ghost" onClick={() => setStep(2)}>
                Voltar
              </Button>
            </div>
          ) : null}

          {step === 4 ? (
            <form
              className="mt-8 grid gap-4"
              onSubmit={chargeForm.handleSubmit(async (values) => {
                const ok = await saveProfile(values.pixKey);
                if (ok) setStep(5);
              })}
            >
              <h1 className="text-3xl font-semibold">
                Como você costuma cobrar?
              </h1>
              <div className="grid gap-2">
                {[
                  { id: "full", label: "Valor completo" },
                  { id: "deposit", label: "Sinal + restante" },
                  { id: "depends", label: "Depende do serviço" },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setChargeMode(item.id)}
                    className={cn(
                      "rounded-md border px-3 py-2 text-left text-sm",
                      chargeMode === item.id
                        ? "border-primary"
                        : "border-border",
                    )}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              <p className="text-sm text-muted-foreground">
                A chave PIX aparece no fechamento. Mercado Pago você conecta
                depois, em Integrações.
              </p>
              <Field
                label="Chave PIX para receber"
                htmlFor="pixKey"
                error={chargeForm.formState.errors.pixKey?.message}
              >
                <Input
                  id="pixKey"
                  placeholder="CPF, CNPJ, e-mail, telefone ou chave aleatória"
                  {...chargeForm.register("pixKey")}
                />
              </Field>
              <Button
                type="submit"
                variant="accent"
                className="h-11"
                disabled={saving}
              >
                {saving ? "Salvando..." : "Continuar"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                disabled={saving}
                onClick={async () => {
                  const ok = await saveProfile();
                  if (ok) setStep(5);
                }}
              >
                Pular por agora
              </Button>
              <Button type="button" variant="ghost" onClick={() => setStep(3)}>
                Voltar
              </Button>
            </form>
          ) : null}

          {step === 5 ? (
            <div className="mt-8 grid gap-6">
              <h1 className="text-3xl font-semibold">Tudo pronto.</h1>
              {slug ? (
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
              ) : null}
              <p className="text-muted-foreground">
                Crie seu primeiro fechamento e envie para um cliente.
              </p>
              <Button
                variant="accent"
                className="h-11"
                onClick={() => router.replace("/app/novo")}
              >
                Criar primeiro fechamento
              </Button>
              <Button variant="ghost" onClick={() => router.replace("/app")}>
                Ir para o painel
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    </main>
  );
}
