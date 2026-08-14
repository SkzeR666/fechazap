"use client";

import { useParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";
import { api } from "@/src/lib/api/client";
import type { PublicQuote, PublicQuoteItem } from "@/src/lib/api/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Field } from "@/components/field";
import { Carimbo } from "@/components/carimbo";
import { Money, formatDateTime } from "@/components/money";
import { STATUS_LABEL, isStamped, stampLabel } from "@/lib/status";
import { daysUntil } from "@/lib/relative-time";
import type { QuoteStatus } from "@/src/domain/quote-state";
import { Skeleton } from "@/components/ui/skeleton";
import { parseClosingMeta } from "@/lib/closing-meta";
import { NarrowPage } from "@/components/narrow-page";
import { MESSAGE_TEMPLATES } from "@/lib/messages";
import { whatsappUrl } from "@/src/lib/whatsapp";

const POLL_STATUSES: QuoteStatus[] = ["awaiting_payment", "paid"];

export default function PublicClosingPage() {
  const { token } = useParams<{ token: string }>();
  const queryClient = useQueryClient();
  const previousStatus = useRef<QuoteStatus | null>(null);
  const [stampKey, setStampKey] = useState(0);
  const [confirming, setConfirming] = useState(false);
  const [scheduling, setScheduling] = useState(false);

  const quoteQuery = useQuery({
    queryKey: ["public-quote", token],
    queryFn: () => api.public.quote(token),
    enabled: Boolean(token),
    refetchInterval: (query) =>
      POLL_STATUSES.includes(query.state.data?.status as QuoteStatus)
        ? 4000
        : false,
  });

  const refresh = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ["public-quote", token] });
  }, [queryClient, token]);

  useEffect(() => {
    const status = quoteQuery.data?.status;
    if (status && previousStatus.current && previousStatus.current !== status) {
      setStampKey((value) => value + 1);
    }
    if (status) previousStatus.current = status;
  }, [quoteQuery.data?.status]);

  if (quoteQuery.isLoading) {
    return (
      <NarrowPage>
        <Skeleton className="h-40" />
      </NarrowPage>
    );
  }
  if (quoteQuery.isError || !quoteQuery.data) {
    return (
      <NarrowPage className="text-center">
        <h1 className="text-2xl font-semibold">Proposta não encontrada</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Este link pode ter expirado ou sido encerrado.
        </p>
      </NarrowPage>
    );
  }

  const quote = quoteQuery.data;
  const animate = stampKey > 0;
  const closed = isClosedStatus(quote.status);
  const meta = parseClosingMeta(quote.message);
  const expired =
    quote.status === "expired" ||
    (Boolean(quote.expiresAt) &&
      new Date(quote.expiresAt!).getTime() < Date.now() &&
      (quote.status === "sent" || quote.status === "viewed"));

  return (
    <NarrowPage>
      {expired ? (
        <ExpiredPanel quote={quote} />
      ) : null}

      {!expired && (quote.status === "sent" || quote.status === "viewed") ? (
        confirming ? (
          <ConfirmForm quote={quote} token={token} onDone={refresh} />
        ) : (
          <ProposalPanel
            quote={quote}
            onClose={() => setConfirming(true)}
          />
        )
      ) : null}

      {quote.status === "accepted" ? (
        <AcceptedPending token={token} onDone={refresh} />
      ) : null}

      {(quote.status === "awaiting_payment" ||
        quote.status === "contracted" ||
        quote.status === "partially_paid") &&
      meta.payment !== "none" ? (
        <PixPanel quote={quote} />
      ) : null}

      {quote.status === "paid" || quote.status === "scheduling_pending" ? (
        meta.schedule === "later" ? (
          <LaterPanel quote={quote} skippedPay={meta.payment === "none"} />
        ) : meta.payment === "none" || scheduling ? (
          <SlotsPanel quote={quote} token={token} onDone={refresh} />
        ) : (
          <PaidPanel quote={quote} onSchedule={() => setScheduling(true)} />
        )
      ) : null}

      {quote.status === "scheduled" ||
      quote.status === "completed" ||
      quote.status === "in_progress" ? (
        <DonePanel quote={quote} />
      ) : null}

      {closed && quote.status !== "expired" ? (
        <div className="text-center">
          <h1 className="text-2xl font-semibold">
            {STATUS_LABEL[quote.status]}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Este link continua disponível caso você precise consultar os
            detalhes.
          </p>
        </div>
      ) : null}

      {quote.status === "requested" || quote.status === "draft" ? (
        <div>
          <h1 className="text-2xl font-semibold">Proposta em preparação</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            O prestador ainda está organizando os detalhes.
          </p>
        </div>
      ) : null}

      {isStamped(quote.status) && !closed && quote.status !== "accepted" ? (
        <div className="mt-8 flex justify-center" key={stampKey}>
          <Carimbo
            size="md"
            animate={animate}
            label={
              quote.status === "scheduled" || quote.status === "in_progress"
                ? stampLabel(
                    quote.status,
                    selectedSlot(quote)
                      ? formatDateTime(selectedSlot(quote)!)
                      : undefined,
                  )
                : stampLabel(
                    quote.status,
                    quote.acceptance
                      ? formatDateTime(quote.acceptance.acceptedAt)
                      : undefined,
                  )
            }
          />
        </div>
      ) : null}
    </NarrowPage>
  );
}

function ProposalPanel({
  quote,
  onClose,
}: {
  quote: PublicQuote;
  onClose: () => void;
}) {
  const doubtHref = providerWhatsApp(quote, MESSAGE_TEMPLATES.duvida);
  return (
    <div>
      {quote.provider.logoUrl ? (
        <img
          src={`/api/v1/public/${quote.provider.slug}/logo`}
          alt=""
          className="mb-4 size-12 rounded-md object-cover"
        />
      ) : null}
      <h1 className="text-2xl font-semibold">
        {quote.provider.businessName} — Proposta de serviço
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {quote.customer.name}, preparei tudo para você por aqui.
      </p>
      {quote.expiresAt ? (
        <p className="mt-2 text-sm text-muted-foreground">
          Esta condição fica disponível por mais {Math.max(daysUntil(quote.expiresAt), 0)}{" "}
          {daysUntil(quote.expiresAt) === 1 ? "dia" : "dias"}.
        </p>
      ) : null}
      <QuoteItems quote={quote} />
      <Button
        variant="accent"
        className="mt-6 h-11 w-full"
        onClick={onClose}
      >
        Quero fechar
      </Button>
      {doubtHref ? (
        <Button
          asChild
          variant="ghost"
          className="mt-2 h-11 w-full text-sm text-muted-foreground"
        >
          <a href={doubtHref} target="_blank" rel="noreferrer">
            Tenho uma dúvida
          </a>
        </Button>
      ) : null}
    </div>
  );
}

function QuoteItems({ quote }: { quote: PublicQuote }) {
  const sinal = depositCents(quote);
  const showSinal = mentionsSinal(quote) && sinal != null;
  return (
    <Card className="mt-6 p-4">
      <ul className="grid gap-3">
        {quote.items.map((item) => (
          <li key={item.id} className="flex justify-between gap-4 text-sm">
            <span>{item.description}</span>
            <Money cents={item.totalCents} />
          </li>
        ))}
      </ul>
      <div className="mt-4 flex justify-between border-t pt-3 font-medium">
        <span>Total</span>
        <Money cents={quote.totalCents} />
      </div>
      {showSinal ? (
        <div className="mt-2 flex justify-between text-sm">
          <span>Sinal para reserva</span>
          <Money cents={sinal} />
        </div>
      ) : null}
    </Card>
  );
}

function AcceptedPending({
  token,
  onDone,
}: {
  token: string;
  onDone: () => void;
}) {
  const [retrying, setRetrying] = useState(false);
  const [failed, setFailed] = useState(false);

  const confirmContract = useCallback(async () => {
    setRetrying(true);
    setFailed(false);
    try {
      await api.public.acceptContract(token);
      onDone();
    } catch {
      setFailed(true);
      toast.error("Não foi possível confirmar o serviço.");
    } finally {
      setRetrying(false);
    }
  }, [onDone, token]);

  useEffect(() => {
    let cancelled = false;
    void api.public
      .acceptContract(token)
      .then(() => {
        if (!cancelled) onDone();
      })
      .catch(() => {
        if (cancelled) return;
        setFailed(true);
        toast.error("Não foi possível confirmar o serviço.");
      });
    return () => {
      cancelled = true;
    };
  }, [onDone, token]);

  return (
    <div className="grid gap-3">
      <h1 className="text-2xl font-semibold">Confirmando serviço</h1>
      <p className="text-sm text-muted-foreground">
        Só um instante, estamos preparando sua reserva.
      </p>
      {failed ? (
        <Button
          variant="accent"
          className="h-11"
          disabled={retrying}
          onClick={() => void confirmContract()}
        >
          {retrying ? "Confirmando..." : "Tentar de novo"}
        </Button>
      ) : (
        <Skeleton className="h-24" />
      )}
    </div>
  );
}

function ConfirmForm({
  quote,
  token,
  onDone,
}: {
  quote: PublicQuote;
  token: string;
  onDone: () => void;
}) {
  const [pending, setPending] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [cpf, setCpf] = useState("");

  async function onSubmit(formData: FormData) {
    if (!agreed) {
      toast.error("Confirme que concorda com as condições do serviço.");
      return;
    }
    const name = String(formData.get("name") ?? "").trim();
    const digits = cpf.replace(/\D/g, "");
    if (digits.length !== 11) {
      toast.error("Informe um CPF válido.");
      return;
    }
    setPending(true);
    try {
      await api.public.acceptQuote(token, { name, cpf: digits });
      try {
        await api.public.acceptContract(token);
      } catch {
        // O status "accepted" dispara a confirmação automática.
      }
      onDone();
    } catch {
      toast.error("Não foi possível confirmar o serviço.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form action={onSubmit} className="grid gap-4">
      <h1 className="text-2xl font-semibold">Confirme seus dados</h1>
      <Field label="Seu nome" htmlFor="name">
        <Input
          id="name"
          name="name"
          required
          minLength={2}
          defaultValue={quote.customer.name}
        />
      </Field>
      {quote.customer.phone ? (
        <p className="text-sm text-muted-foreground">{quote.customer.phone}</p>
      ) : null}
      <Field label="CPF" htmlFor="cpf">
        <Input
          id="cpf"
          name="cpf"
          inputMode="numeric"
          autoComplete="off"
          required
          value={cpf}
          onChange={(event) => setCpf(maskCpf(event.target.value))}
          placeholder="000.000.000-00"
        />
      </Field>
      <label className="flex items-start gap-3 text-sm leading-relaxed">
        <Checkbox
          checked={agreed}
          onCheckedChange={(value) => setAgreed(value === true)}
          className="mt-0.5"
        />
        <span>Li e concordo com as condições do serviço.</span>
      </label>
      {quote.provider.cancellationPolicy ? (
        <p className="text-sm text-muted-foreground">
          {quote.provider.cancellationPolicy}
        </p>
      ) : null}
      <Button
        type="submit"
        variant="accent"
        className="h-11"
        disabled={pending || !agreed}
      >
        {pending ? "Confirmando..." : "Confirmar serviço"}
      </Button>
    </form>
  );
}

function PixPanel({ quote }: { quote: PublicQuote }) {
  const automaticPix = quote.payment?.pixCode;
  const pix = automaticPix ?? quote.provider.pixKey;
  const amount = depositCents(quote) ?? quote.totalCents;
  const [waiting, setWaiting] = useState(false);

  return (
    <div>
      <h1 className="text-2xl font-semibold">Falta só confirmar sua reserva</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Faça o Pix de <Money cents={amount} /> para reservar seu atendimento.
      </p>
      {!pix ? (
        <p className="mt-6 text-sm text-muted-foreground">
          Aguardando a chave PIX do prestador.
        </p>
      ) : (
        <div className="mt-6 grid justify-items-center gap-4">
          <QRCodeSVG value={pix} size={180} />
          <p className="font-medium">
            <Money cents={amount} />
          </p>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            PIX copia e cola
          </p>
          <p className="break-all text-center font-mono text-sm">{pix}</p>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => {
              void navigator.clipboard.writeText(pix);
              toast.success("Código copiado.");
            }}
          >
            Copiar código
          </Button>
          {quote.payment?.ticketUrl ? (
            <Button asChild variant="outline" className="w-full">
              <a href={quote.payment.ticketUrl} target="_blank" rel="noreferrer">
                Abrir página do PIX
              </a>
            </Button>
          ) : null}
          <Button
            variant="accent"
            className="h-11 w-full"
            onClick={() => setWaiting(true)}
          >
            Já paguei
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            {waiting
              ? "Aguardando confirmação do pagamento..."
              : "Assim que o pagamento for identificado, você poderá escolher seu horário."}
          </p>
        </div>
      )}
    </div>
  );
}

function PaidPanel({
  quote,
  onSchedule,
}: {
  quote: PublicQuote;
  onSchedule: () => void;
}) {
  const received = depositCents(quote) ?? quote.totalCents;
  return (
    <div>
      <h1 className="text-2xl font-semibold">Pagamento confirmado ✓</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Sua reserva está garantida.
      </p>
      <p className="mt-4 text-sm">
        <Money cents={received} /> recebido
      </p>
      <Button
        variant="accent"
        className="mt-6 h-11 w-full"
        onClick={onSchedule}
      >
        Escolher horário
      </Button>
    </div>
  );
}

function SlotsPanel({
  quote,
  token,
  onDone,
}: {
  quote: PublicQuote;
  token: string;
  onDone: () => void;
}) {
  const offered = quote.appointments.filter((item) => item.status === "offered");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = offered.find((item) => item.id === selectedId);
  const mutation = useMutation({
    mutationFn: (id: string) => api.public.selectAppointment(token, id),
    onSuccess: onDone,
    onError: () => toast.error("Horário indisponível."),
  });

  if (offered.length === 0) {
    return (
      <div>
        <h1 className="text-2xl font-semibold">Quando fica melhor para você?</h1>
        <p className="mt-4 text-sm text-muted-foreground">
          Aguardando horários do prestador.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold">Quando fica melhor para você?</h1>
      <div className="mt-6 grid gap-3">
        {offered.map((slot) => (
          <button
            key={slot.id}
            type="button"
            className={`rounded-md border bg-card p-4 text-left font-mono hover:border-primary ${
              selectedId === slot.id ? "border-primary" : ""
            }`}
            onClick={() => setSelectedId(slot.id)}
            disabled={mutation.isPending}
          >
            {formatDateTime(slot.startsAt)}
          </button>
        ))}
      </div>
      {selected ? (
        <p className="mt-4 text-sm text-muted-foreground">
          {formatDateTime(selected.startsAt)}
          {serviceName(quote) ? ` · ${serviceName(quote)}` : null}
        </p>
      ) : null}
      <Button
        variant="accent"
        className="mt-6 h-11 w-full"
        disabled={!selectedId || mutation.isPending}
        onClick={() => {
          if (selectedId) mutation.mutate(selectedId);
        }}
      >
        {mutation.isPending ? "Confirmando..." : "Confirmar horário"}
      </Button>
    </div>
  );
}

function DonePanel({ quote }: { quote: PublicQuote }) {
  const slot = selectedSlot(quote);
  const chatHref = providerWhatsApp(
    quote,
    "Oi! Sobre o atendimento confirmado.",
  );
  const rescheduleHref = providerWhatsApp(
    quote,
    "Oi! Preciso mudar o horário do atendimento.",
  );
  return (
    <div className="text-center">
      <h1 className="text-2xl font-semibold">Fechado. Até lá. ✓</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Seu atendimento com {quote.provider.businessName} está confirmado.
      </p>
      {slot ? <SlotDetails iso={slot} /> : null}
      {serviceName(quote) ? (
        <p className="mt-3 font-medium">{serviceName(quote)}</p>
      ) : null}
      {chatHref ? (
        <Button asChild variant="accent" className="mt-6 h-11 w-full">
          <a href={chatHref} target="_blank" rel="noreferrer">
            Falar pelo WhatsApp
          </a>
        </Button>
      ) : null}
      {slot ? (
        <Button asChild variant="outline" className="mt-2 h-11 w-full">
          <a
            href={googleCalendarUrl(
              `${serviceName(quote) ?? "Atendimento"} · ${quote.provider.businessName}`,
              slot,
            )}
            target="_blank"
            rel="noreferrer"
          >
            Adicionar ao calendário
          </a>
        </Button>
      ) : null}
      {rescheduleHref ? (
        <Button asChild variant="ghost" className="mt-2 h-11 w-full">
          <a href={rescheduleHref} target="_blank" rel="noreferrer">
            Precisa mudar o horário? Solicitar reagendamento
          </a>
        </Button>
      ) : null}
      <p className="mt-6 text-sm text-muted-foreground">
        Este link continuará disponível caso você precise consultar os detalhes.
      </p>
    </div>
  );
}

function SlotDetails({ iso }: { iso: string }) {
  const date = new Date(iso);
  const dayMonth = new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
  }).format(date);
  const weekday = new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
  }).format(date);
  const time = new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
  return (
    <div className="mt-6">
      <p className="font-mono text-lg uppercase">{dayMonth}</p>
      <p className="capitalize text-muted-foreground">{weekday}</p>
      <p className="mt-2 font-mono text-2xl tabular-nums">{time}</p>
    </div>
  );
}

function selectedSlot(quote: PublicQuote) {
  return quote.appointments.find((item) => item.status === "selected")
    ?.startsAt;
}

function serviceName(quote: PublicQuote) {
  return quote.title ?? quote.items.find((item) => !isDepositItem(item))
    ?.description ?? quote.items[0]?.description ?? null;
}

function isDepositItem(item: PublicQuoteItem) {
  return /^(entrada|sinal)\b/i.test(item.description.trim());
}

function mentionsSinal(quote: PublicQuote) {
  const meta = parseClosingMeta(quote.message);
  if (meta.payment === "deposit") return true;
  if (/\bsinal\b/i.test(quote.message ?? "")) return true;
  return quote.items.some(isDepositItem);
}

function depositCents(quote: PublicQuote) {
  const meta = parseClosingMeta(quote.message);
  if (meta.payment === "deposit" && meta.depositCents) return meta.depositCents;
  if (meta.payment === "full") return quote.totalCents;
  return quote.items.find(isDepositItem)?.totalCents ?? null;
}

function LaterPanel({
  quote,
  skippedPay,
}: {
  quote: PublicQuote;
  skippedPay: boolean;
}) {
  const chatHref = providerWhatsApp(
    quote,
    "Oi! Quero combinar o horário do atendimento.",
  );
  return (
    <div className="text-center">
      <h1 className="text-2xl font-semibold">
        {skippedPay ? "Serviço confirmado ✓" : "Pagamento confirmado ✓"}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        O horário ainda vai ser combinado com {quote.provider.businessName}.
      </p>
      {chatHref ? (
        <Button asChild variant="accent" className="mt-6 h-11 w-full">
          <a href={chatHref} target="_blank" rel="noreferrer">
            Combinar horário no WhatsApp
          </a>
        </Button>
      ) : null}
    </div>
  );
}

function isClosedStatus(status: QuoteStatus) {
  return (
    status === "cancelled" ||
    status === "expired" ||
    status === "declined" ||
    status === "refunded"
  );
}

function ExpiredPanel({ quote }: { quote: PublicQuote }) {
  const chatHref = providerWhatsApp(
    quote,
    "Oi! A proposta expirou. Pode enviar uma nova condição?",
  );
  return (
    <div className="text-center">
      <h1 className="text-2xl font-semibold">Esta proposta expirou</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Entre em contato com o profissional para solicitar uma nova condição.
      </p>
      {chatHref ? (
        <Button asChild variant="accent" className="mt-6 h-11 w-full">
          <a href={chatHref} target="_blank" rel="noreferrer">
            Falar pelo WhatsApp
          </a>
        </Button>
      ) : null}
    </div>
  );
}

function googleCalendarUrl(title: string, startIso: string) {
  const start = new Date(startIso);
  const end = new Date(start.getTime() + 60 * 60 * 1000);
  const stamp = (value: Date) =>
    value
      .toISOString()
      .replace(/[-:]/g, "")
      .replace(/\.\d{3}Z$/, "Z");
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    dates: `${stamp(start)}/${stamp(end)}`,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function maskCpf(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  return digits
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

function providerWhatsApp(quote: PublicQuote, message: string) {
  if (!quote.provider.whatsapp) return null;
  return whatsappUrl(quote.provider.whatsapp, message);
}
