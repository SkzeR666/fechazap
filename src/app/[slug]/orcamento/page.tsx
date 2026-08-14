"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
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
import { NarrowPage } from "@/components/narrow-page";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";

const schema = z.object({
  name: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(8).max(30),
  message: z.string().trim().max(2000).optional(),
  serviceId: z.string().uuid().optional(),
});

export default function PublicQuoteRequestPage() {
  return (
    <Suspense
      fallback={
        <NarrowPage>
          <Skeleton className="h-10 w-48" />
          <Skeleton className="mt-6 h-40" />
        </NarrowPage>
      }
    >
      <QuoteRequestForm />
    </Suspense>
  );
}

function QuoteRequestForm() {
  const { slug } = useParams<{ slug: string }>();
  const searchParams = useSearchParams();
  const [sent, setSent] = useState(false);
  const [pending, setPending] = useState(false);
  const [serviceId, setServiceId] = useState<string>("");
  const profile = useQuery({
    queryKey: ["public-profile", slug],
    queryFn: () => api.public.profile(slug),
    enabled: Boolean(slug),
  });

  useEffect(() => {
    const fromQuery = searchParams.get("servico");
    if (fromQuery && z.string().uuid().safeParse(fromQuery).success) {
      setServiceId(fromQuery);
    }
  }, [searchParams]);

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

  const selected = profile.data?.services.find((item) => item.id === serviceId);

  if (sent) {
    return (
      <NarrowPage className="text-center">
        <h1 className="text-2xl font-semibold">Pedido enviado</h1>
        <p className="mt-3 text-muted-foreground">
          {profile.data?.businessName} vai montar a proposta e te enviar o
          link. Sem criar conta.
        </p>
        <Button asChild variant="outline" className="mt-6">
          <Link href={`/${slug}`}>Voltar à página</Link>
        </Button>
      </NarrowPage>
    );
  }

  return (
    <NarrowPage>
      <p className="font-mono text-xs tracking-widest text-primary uppercase">
        {profile.data?.businessName}
      </p>
      <h1 className="mt-2 text-2xl font-semibold">Solicitar atendimento</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {selected
          ? `Serviço: ${selected.name}. Preencha seus dados — o prestador responde com o link de fechamento.`
          : "Qual serviço você procura? O prestador monta a proposta e envia o link."}
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
            <Select
              value={serviceId || undefined}
              onValueChange={setServiceId}
            >
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
          {pending ? "Enviando..." : "Solicitar atendimento"}
        </Button>
      </form>
    </NarrowPage>
  );
}
