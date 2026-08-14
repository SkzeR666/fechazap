"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { toast } from "sonner";
import { api } from "@/src/lib/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const schema = z.object({
  name: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(8).max(30),
  message: z.string().trim().max(2000).optional(),
  serviceId: z.string().uuid().optional(),
});

export default function PublicQuoteRequestPage() {
  const { slug } = useParams<{ slug: string }>();
  const [sent, setSent] = useState(false);
  const [pending, setPending] = useState(false);
  const [serviceId, setServiceId] = useState<string>("");
  const profile = useQuery({
    queryKey: ["public-profile", slug],
    queryFn: () => api.public.profile(slug),
    enabled: Boolean(slug),
  });

  async function onSubmit(formData: FormData) {
    const parsed = schema.safeParse({
      name: formData.get("name"),
      phone: formData.get("phone"),
      message: formData.get("message") || undefined,
      serviceId: serviceId || undefined,
    });
    if (!parsed.success) {
      toast.error("Preencha nome e WhatsApp.");
      return;
    }
    setPending(true);
    try {
      await api.public.requestQuote(slug, {
        customer: { name: parsed.data.name, phone: parsed.data.phone },
        message: parsed.data.message,
        serviceId: parsed.data.serviceId,
      });
      setSent(true);
    } catch {
      toast.error("Não foi possível enviar o pedido.");
    } finally {
      setPending(false);
    }
  }

  if (sent) {
    return (
      <main className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold">Pedido enviado</h1>
        <p className="mt-3 text-muted-foreground">
          O prestador vai montar o orçamento e te enviar o link.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-md px-4 py-10">
      <h1 className="text-2xl font-semibold">Pedir orçamento</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {profile.data?.businessName}
      </p>
      <form action={onSubmit} className="mt-8 grid gap-4">
        <Field label="Seu nome" htmlFor="name">
          <Input id="name" name="name" required />
        </Field>
        <Field label="WhatsApp" htmlFor="phone">
          <Input id="phone" name="phone" required />
        </Field>
        {profile.data?.services.length ? (
          <Field label="Serviço">
            <Select value={serviceId} onValueChange={setServiceId}>
              <SelectTrigger>
                <SelectValue placeholder="Escolher (opcional)" />
              </SelectTrigger>
              <SelectContent>
                {profile.data.services.map((service) => (
                  <SelectItem key={service.id} value={service.id}>
                    {service.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        ) : null}
        <Field label="O que você precisa?" htmlFor="message">
          <Textarea id="message" name="message" rows={4} />
        </Field>
        <Button
          type="submit"
          variant="accent"
          className="h-11"
          disabled={pending}
        >
          {pending ? "Enviando..." : "Enviar pedido"}
        </Button>
      </form>
    </main>
  );
}
