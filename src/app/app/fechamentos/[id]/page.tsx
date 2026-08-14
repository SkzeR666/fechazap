"use client";

import Link from "next/link";
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
import {
  STATUS_LABEL,
  EVENT_LABEL,
  isStamped,
  nextActionCopy,
  stampLabel,
} from "@/lib/status";
import { one, publicClosingUrl, reaisToCents } from "@/lib/format";
import { Skeleton } from "@/components/ui/skeleton";
import type { QuoteStatus } from "@/src/domain/quote-state";
import { whatsappUrl } from "@/src/lib/whatsapp";
import { interpolate, MESSAGE_TEMPLATES } from "@/lib/messages";

export default function FechamentoDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { token, ready } = useAccessToken();
  const queryClient = useQueryClient();
  const quoteQuery = useQuery({
    queryKey: ["quote", id, token],
    queryFn: () => api.provider.quote(token!, id),
    enabled: ready && Boolean(token) && Boolean(id),
  });

  if (!ready || quoteQuery.isLoading) return <Skeleton className="h-80" />;
  if (!quoteQuery.data) return <p>Fechamento não encontrado.</p>;

  const quote = quoteQuery.data;
  const customer = one(quote.customers);
  const customerName = customer?.name ?? "cliente";
  const customerPhone = customer?.phone ?? "";
  const link = publicClosingUrl(quote.public_token);
  const events = [...(quote.quote_events ?? [])].sort(
    (a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
  );
  const action = nextActionCopy(quote.status);
  const proposalMessage = interpolate(MESSAGE_TEMPLATES.novaProposta, {
    cliente: customerName,
    link,
  });
  const reminderMessage = interpolate(
    quote.status === "sent" || quote.status === "viewed" || quote.status === "draft"
      ? MESSAGE_TEMPLATES.novaProposta
      : quote.status === "paid" || quote.status === "scheduling_pending"
        ? MESSAGE_TEMPLATES.agendamento
        : MESSAGE_TEMPLATES.pagamentoPendente,
    { cliente: customerName, link },
  );

  async function refresh() {
    await queryClient.invalidateQueries({ queryKey: ["quote", id] });
    await queryClient.invalidateQueries({ queryKey: ["quotes"] });
  }

  return (
    <div className="grid gap-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">
            <Link href="/app/fechamentos" className="hover:underline">
              Fechamentos
            </Link>
          </p>
          <h1 className="mt-1 text-2xl font-semibold">
            {customer?.name ?? "Cliente"}
          </h1>
          <p className="text-muted-foreground">{quote.title ?? "Serviço"}</p>
          <p className="mt-2">
            <Money cents={quote.total_cents} />
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {STATUS_LABEL[quote.status]}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="accent">
            <a
              href={whatsappUrl(customerPhone, proposalMessage)}
              target="_blank"
              rel="noreferrer"
            >
              Enviar proposta pelo WhatsApp
            </a>
          </Button>
          <Button
            variant="outline"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(link);
                toast.success("Link copiado.");
              } catch {
                toast.error("Não foi possível copiar o link.");
              }
            }}
          >
            Copiar link
          </Button>
        </div>
      </div>

      {action ? (
        <Card className="grid max-w-lg gap-3 p-5">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Próxima etapa
            </p>
            <h2 className="mt-1 font-medium">{action.title}</h2>
            <p className="text-sm text-muted-foreground">{action.body}</p>
          </div>
          <NextActionButton
            cta={action.cta}
            status={quote.status}
            token={token}
            quoteId={id}
            whatsappHref={whatsappUrl(customerPhone, reminderMessage)}
            onDone={refresh}
          />
        </Card>
      ) : null}

      {quote.status === "requested" ? (
        <RequestResponse
          quoteId={id}
          token={token}
          initialTitle={quote.title ?? quote.message ?? "Pedido solicitado"}
          customerName={customerName}
          customerPhone={customerPhone}
          publicLink={link}
        />
      ) : null}

      {quote.status === "awaiting_payment" ||
      quote.status === "accepted" ||
      quote.status === "contracted" ||
      quote.status === "partially_paid" ? (
        <div className="grid max-w-md gap-3 sm:grid-cols-2">
          {quote.status === "awaiting_payment" ? (
            <Button
              variant="accent"
              onClick={async () => {
                if (!token) return;
                try {
                  await api.provider.createMercadoPagoPix(token, id);
                  await refresh();
                  toast.success("PIX automático criado e exibido ao cliente.");
                } catch {
                  toast.error(
                    "Não foi possível gerar. Conecte o Mercado Pago em Integrações e confira o e-mail do cliente.",
                  );
                }
              }}
            >
              Gerar PIX automático
            </Button>
          ) : null}
          <Button
            variant="outline"
            onClick={async () => {
              if (!token) return;
              try {
                await api.provider.confirmManualPayment(token, id);
                await refresh();
                toast.success("Pagamento confirmado.");
              } catch {
                toast.error("Não foi possível confirmar o PIX.");
              }
            }}
          >
            Confirmar PIX
          </Button>
        </div>
      ) : null}

      {quote.status === "paid" || quote.status === "scheduling_pending" ? (
        <OfferSlots quoteId={id} token={token} />
      ) : null}

      {quote.status === "accepted" ||
      quote.status === "contracted" ||
      quote.status === "scheduled" ? (
        <Button
          variant="outline"
          className="w-fit"
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

      <section>
        <h2 className="mb-4 text-sm font-medium text-muted-foreground">
          Histórico
        </h2>
        {events.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Ainda não há movimentações neste fechamento.
          </p>
        ) : (
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
                        {EVENT_LABEL[event.event_type] ??
                          event.event_type.replaceAll("_", " ")}
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
        )}
      </section>
    </div>
  );
}

function NextActionButton({
  cta,
  status,
  token,
  quoteId,
  whatsappHref,
  onDone,
}: {
  cta: string;
  status: QuoteStatus;
  token: string | null;
  quoteId: string;
  whatsappHref: string;
  onDone: () => Promise<void>;
}) {
  const [pending, setPending] = useState(false);
  if (
    cta === "Enviar proposta pelo WhatsApp" ||
    cta === "Reenviar" ||
    cta === "Enviar lembrete"
  ) {
    return (
      <Button asChild variant="accent" className="w-fit">
        <a href={whatsappHref} target="_blank" rel="noreferrer">
          {cta}
        </a>
      </Button>
    );
  }
  if (cta === "Responder" || cta === "Agendar") {
    return null;
  }
  return (
    <Button
      variant="accent"
      className="w-fit"
      disabled={pending}
      onClick={async () => {
        if (!token) return;
        setPending(true);
        try {
          if (cta === "Concluir") {
            await api.provider.transition(token, quoteId, "completed");
            toast.success("Serviço marcado como concluído.");
          } else if (cta === "Registrar pagamento") {
            await api.provider.confirmManualPayment(token, quoteId);
            toast.success("Pagamento confirmado.");
          } else if (status === "accepted" || status === "contracted") {
            await api.provider.confirmManualPayment(token, quoteId);
            toast.success("Pagamento confirmado.");
          }
          await onDone();
        } catch {
          toast.error("Não foi possível atualizar este fechamento.");
        } finally {
          setPending(false);
        }
      }}
    >
      {cta}
    </Button>
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
  publicLink: string;
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
      toast.success("Proposta enviada e pronta para compartilhar.");
    },
    onError: () => toast.error("Revise o título e informe um valor válido."),
  });

  if (sent) {
    const message = interpolate(MESSAGE_TEMPLATES.novaProposta, {
      cliente: customerName,
      link: publicLink,
    });
    return (
      <Card className="grid max-w-lg gap-3 p-5">
        <h2 className="font-medium">Proposta pronta</h2>
        <p className="break-all font-mono text-xs text-muted-foreground">
          {publicLink}
        </p>
        <Button asChild variant="accent">
          <a
            href={whatsappUrl(customerPhone, message)}
            target="_blank"
            rel="noreferrer"
          >
            Enviar proposta pelo WhatsApp
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
          Monte a proposta sem criar outro cliente ou pedido.
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
        {mutation.isPending ? "Enviando..." : "Montar e enviar proposta"}
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
