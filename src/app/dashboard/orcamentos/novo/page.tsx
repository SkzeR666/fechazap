"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { api } from "@/src/lib/api/client";
import { useAccessToken } from "@/hooks/use-access-token";
import { useProfile } from "@/hooks/use-profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Field } from "@/components/field";
import { publicQuoteUrl, reaisToCents } from "@/lib/format";
import { whatsappUrl } from "@/src/lib/whatsapp";
import { Label } from "@/components/ui/label";

const schema = z.object({
  name: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(8).max(30),
  title: z.string().trim().min(1).max(200),
  amount: z.string().min(1),
  deposit: z.enum(["no", "yes"]),
  depositAmount: z.string().optional(),
  schedule: z.string(),
});

export default function NewQuotePage() {
  const { token } = useAccessToken();
  const profile = useProfile();
  const [link, setLink] = useState<string | null>(null);
  const [phone, setPhone] = useState("");
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      phone: "",
      title: "",
      amount: "",
      deposit: "no" as const,
      depositAmount: "",
      schedule: "after_payment",
    },
  });
  const deposit = form.watch("deposit");

  async function onSubmit(values: z.infer<typeof schema>) {
    if (!token) return;
    const amountCents = reaisToCents(values.amount);
    if (amountCents == null || amountCents <= 0) {
      form.setError("amount", { message: "Informe um valor válido." });
      return;
    }
    const depositCents =
      values.deposit === "yes"
        ? reaisToCents(values.depositAmount ?? "")
        : null;
    try {
      const quote = await api.provider.createQuote(token, {
        customer: { name: values.name, phone: values.phone },
        title: values.title,
      });
      const items =
        depositCents && depositCents > 0
          ? [
              {
                description: `Entrada — ${values.title}`,
                quantity: 1,
                unitPriceCents: depositCents,
                sortOrder: 0,
              },
              {
                description: values.title,
                quantity: 1,
                unitPriceCents: Math.max(0, amountCents - depositCents),
                sortOrder: 1,
              },
            ]
          : [
              {
                description: values.title,
                quantity: 1,
                unitPriceCents: amountCents,
                sortOrder: 0,
              },
            ];
      const expires = new Date();
      expires.setDate(expires.getDate() + 7);
      await api.provider.replaceItems(token, quote.id, {
        title: values.title,
        expiresAt: expires.toISOString(),
        items,
      });
      await api.provider.transition(token, quote.id, "sent");
      const slug = profile.data?.data?.slug;
      if (!slug) {
        toast.error("Complete o perfil para gerar o link.");
        return;
      }
      setPhone(values.phone);
      setLink(publicQuoteUrl(slug, quote.public_token));
    } catch {
      toast.error("Não foi possível gerar o link.");
    }
  }

  if (link) {
    return (
      <div className="max-w-lg">
        <h1 className="text-2xl font-semibold">Link gerado</h1>
        <p className="mt-4 break-all font-mono text-sm">{link}</p>
        <div className="mt-6 grid gap-3">
          <Button
            variant="outline"
            onClick={() => {
              void navigator.clipboard.writeText(link);
              toast.success("Link copiado.");
            }}
          >
            Copiar link
          </Button>
          <Button asChild variant="accent" className="h-11">
            <a
              href={whatsappUrl(phone, `Olá! Segue o orçamento: ${link}`)}
              target="_blank"
              rel="noreferrer"
            >
              Enviar pelo WhatsApp
            </a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-semibold">Novo fechamento</h1>
      <form className="mt-8 grid gap-4" onSubmit={form.handleSubmit(onSubmit)}>
        <Field
          label="Nome do cliente"
          htmlFor="name"
          error={form.formState.errors.name?.message}
        >
          <Input id="name" {...form.register("name")} />
        </Field>
        <Field
          label="WhatsApp"
          htmlFor="phone"
          error={form.formState.errors.phone?.message}
        >
          <Input id="phone" {...form.register("phone")} />
        </Field>
        <Field
          label="O que vai fazer?"
          htmlFor="title"
          error={form.formState.errors.title?.message}
        >
          <Input id="title" {...form.register("title")} />
        </Field>
        <Field
          label="Quanto?"
          htmlFor="amount"
          error={form.formState.errors.amount?.message}
        >
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm">R$</span>
            <Input
              id="amount"
              inputMode="decimal"
              {...form.register("amount")}
            />
          </div>
        </Field>
        <Field label="Vai cobrar entrada?">
          <RadioGroup
            value={deposit}
            onValueChange={(value) =>
              form.setValue("deposit", value as "no" | "yes")
            }
            className="flex gap-6"
          >
            <div className="flex items-center gap-2">
              <RadioGroupItem value="no" id="deposit-no" />
              <Label htmlFor="deposit-no">Não</Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="yes" id="deposit-yes" />
              <Label htmlFor="deposit-yes">Sim</Label>
            </div>
          </RadioGroup>
        </Field>
        {deposit === "yes" ? (
          <Field label="Valor da entrada" htmlFor="depositAmount">
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm">R$</span>
              <Input
                id="depositAmount"
                inputMode="decimal"
                {...form.register("depositAmount")}
              />
            </div>
          </Field>
        ) : null}
        <Field label="Quando agendar?">
          <Select
            value={form.watch("schedule")}
            onValueChange={(value) => form.setValue("schedule", value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="after_payment">Depois do pagamento</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Button
          type="submit"
          variant="accent"
          className="h-11 w-full"
          disabled={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting ? "Gerando..." : "Gerar link"}
        </Button>
      </form>
    </div>
  );
}
