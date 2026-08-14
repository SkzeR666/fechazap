"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/src/lib/api/client";
import { useAccessToken } from "@/hooks/use-access-token";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Money, Timestamp } from "@/components/money";
import { Carimbo } from "@/components/carimbo";
import { STATUS_LABEL, isStamped, stampLabel } from "@/lib/status";
import { one, publicQuoteUrl } from "@/lib/format";
import { reaisToCents } from "@/lib/format";
import { useProfile } from "@/hooks/use-profile";
import { Skeleton } from "@/components/ui/skeleton";
import type { QuoteStatus } from "@/src/domain/quote-state";
import { whatsappUrl } from "@/src/lib/whatsapp";

export default function QuoteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { token, ready } = useAccessToken();
  const profile = useProfile();
  const queryClient = useQueryClient();
  const quoteQuery = useQuery({
    queryKey: ["quote", id, token],
    queryFn: () => api.provider.quote(token!, id),
    enabled: ready && Boolean(token) && Boolean(id),
  });

  if (!ready || quoteQuery.isLoading) return <Skeleton className="h-80" />;
  if (!quoteQuery.data) return <p>Orçamento não encontrado.</p>;

  const quote = quoteQuery.data;
  const customer = one(quote.customers);
  const events = [...(quote.quote_events ?? [])].sort(
    (a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
  );
  const slug = profile.data?.data?.slug;
  const link = slug ? publicQuoteUrl(slug, quote.public_token) : null;

  return (
    <div className="grid gap-8">
      <div>
        <h1 className="text-2xl font-semibold">{quote.title ?? "Orçamento"}</h1>
        <p className="text-muted-foreground">{customer?.name}</p>
        <p className="mt-2">
          <Money cents={quote.total_cents} />
        </p>
        {link ? (
          <p className="mt-2 break-all font-mono text-xs text-muted-foreground">
            {link}
          </p>
        ) : null}
      </div>

      {quote.status === "requested" ? (
        <RequestResponse
          quoteId={id}
          token={token}
          initialTitle={quote.title ?? quote.message ?? "Orçamento solicitado"}
          customerName={customer?.name ?? "cliente"}
          customerPhone={customer?.phone ?? ""}
          publicLink={link}
        />
      ) : null}

      <section>
        <h2 className="mb-4 text-sm font-medium text-muted-foreground">
          Linha do tempo
        </h2>
        <ol className="grid gap-6 border-l pl-6">
          {events.map((event) => {
            const status = (event.to_status ?? quote.status) as QuoteStatus;
            return (
              <li key={event.id} className="relative">
                <span className="absolute -left-[31px] top-1 size-2 rounded-full bg-primary" />
                <div className="flex items-start gap-4">
                  {isStamped(status) ? (
                    <Carimbo size="sm" label={stampLabel(status)} />
                  ) : (
                    <p className="font-mono text-xs uppercase">
                      {STATUS_LABEL[status]}
                    </p>
                  )}
                  <div>
                    <p className="text-sm">
                      {event.event_type.replaceAll("_", " ")}
                    </p>
                    <Timestamp
                      iso={event.created_at}
                      className="text-xs text-muted-foreground"
                    />
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </section>

      {quote.status === "awaiting_payment" ? (
        <Button
          variant="accent"
          onClick={async () => {
            if (!token) return;
            try {
              await api.provider.confirmManualPayment(token, id);
              await queryClient.invalidateQueries({ queryKey: ["quote", id] });
              toast.success("Pagamento confirmado.");
            } catch {
              toast.error("Não foi possível confirmar o PIX.");
            }
          }}
        >
          Confirmar PIX recebido
        </Button>
      ) : null}

      {quote.status === "paid" ? (
        <OfferSlots quoteId={id} token={token} />
      ) : null}

      {quote.status === "accepted" || quote.status === "scheduled" ? (
        <Button
          variant="outline"
          onClick={async () => {
            if (!token) return;
            try {
              const { downloadUrl } = await api.provider.generateContract(
                token,
                id,
              );
              window.location.href = downloadUrl;
            } catch {
              toast.error("Não foi possível gerar o contrato.");
            }
          }}
        >
          Gerar / baixar contrato
        </Button>
      ) : null}
    </div>
  );
}

function RequestResponse({
  quoteId,
  token,
  initialTitle,
  customerName,
  customerPhone,
  publicLink,
}: {
  quoteId: string;
  token: string | null;
  initialTitle: string;
  customerName: string;
  customerPhone: string;
  publicLink: string | null;
}) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState(initialTitle);
  const [amount, setAmount] = useState("");
  const [sent, setSent] = useState(false);
  const mutation = useMutation({
    mutationFn: async () => {
      if (!token) throw new Error("missing_token");
      const amountCents = reaisToCents(amount);
      if (!amountCents || amountCents <= 0) throw new Error("invalid_amount");
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);
      await api.provider.replaceItems(token, quoteId, {
        title,
        expiresAt: expiresAt.toISOString(),
        items: [
          {
            description: title,
            quantity: 1,
            unitPriceCents: amountCents,
            sortOrder: 0,
          },
        ],
      });
      await api.provider.transition(token, quoteId, "sent");
    },
    onSuccess: async () => {
      setSent(true);
      await queryClient.invalidateQueries({ queryKey: ["quote", quoteId] });
      await queryClient.invalidateQueries({ queryKey: ["quotes"] });
      toast.success("Orçamento enviado e pronto para compartilhar.");
    },
    onError: () => toast.error("Revise o título e informe um valor válido."),
  });

  if (sent && publicLink) {
    return (
      <Card className="grid max-w-lg gap-3 p-5">
        <h2 className="font-medium">Orçamento pronto</h2>
        <p className="break-all font-mono text-xs text-muted-foreground">
          {publicLink}
        </p>
        <Button asChild variant="accent">
          <a
            href={whatsappUrl(
              customerPhone,
              `Olá, ${customerName}! Seu orçamento está pronto: ${publicLink}`,
            )}
            target="_blank"
            rel="noreferrer"
          >
            Responder pelo WhatsApp
          </a>
        </Button>
      </Card>
    );
  }

  return (
    <Card className="grid max-w-lg gap-4 p-5">
      <div>
        <h2 className="font-medium">Responder pedido</h2>
        <p className="text-sm text-muted-foreground">
          Monte o orçamento sem criar outro cliente ou pedido.
        </p>
      </div>
      <Input
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        placeholder="Serviço ou proposta"
      />
      <div className="flex items-center gap-2">
        <span className="font-mono text-sm">R$</span>
        <Input
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          inputMode="decimal"
          placeholder="0,00"
        />
      </div>
      <Button
        variant="accent"
        disabled={mutation.isPending}
        onClick={() => mutation.mutate()}
      >
        {mutation.isPending ? "Enviando..." : "Montar e enviar orçamento"}
      </Button>
    </Card>
  );
}

function OfferSlots({
  quoteId,
  token,
}: {
  quoteId: string;
  token: string | null;
}) {
  const queryClient = useQueryClient();
  const [slots, setSlots] = useState(["", "", ""]);
  const mutation = useMutation({
    mutationFn: (values: string[]) =>
      api.provider.offerAppointments(token!, quoteId, values),
    onSuccess: () => {
      toast.success("Horários enviados.");
      void queryClient.invalidateQueries({ queryKey: ["quote", quoteId] });
    },
    onError: () => toast.error("Ofereça de 2 a 5 horários."),
  });

  return (
    <Card className="grid max-w-md gap-3 p-4">
      <h2 className="font-medium">Oferecer horários</h2>
      {slots.map((slot, index) => (
        <Input
          key={index}
          type="datetime-local"
          value={slot}
          onChange={(event) => {
            const next = [...slots];
            next[index] = event.target.value;
            setSlots(next);
          }}
        />
      ))}
      {slots.length < 5 ? (
        <Button
          type="button"
          variant="ghost"
          onClick={() => setSlots([...slots, ""])}
        >
          + horário
        </Button>
      ) : null}
      <Button
        variant="accent"
        disabled={mutation.isPending}
        onClick={() => {
          const iso = slots
            .filter(Boolean)
            .map((value) => new Date(value).toISOString());
          mutation.mutate(iso);
        }}
      >
        Enviar horários
      </Button>
    </Card>
  );
}
