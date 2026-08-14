"use client";

import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";
import { api } from "@/src/lib/api/client";
import type { PublicQuote } from "@/src/lib/api/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/field";
import { Carimbo } from "@/components/carimbo";
import {
  Money,
  Timestamp,
  formatDate,
  formatDateTime,
} from "@/components/money";
import { STATUS_LABEL, isStamped, stampLabel } from "@/lib/status";
import type { QuoteStatus } from "@/src/domain/quote-state";
import { Skeleton } from "@/components/ui/skeleton";

const POLL_STATUSES: QuoteStatus[] = ["awaiting_payment", "paid"];

export default function PublicQuotePage() {
  const { token } = useParams<{ token: string }>();
  const queryClient = useQueryClient();
  const previousStatus = useRef<QuoteStatus | null>(null);
  const [stampKey, setStampKey] = useState(0);

  const quoteQuery = useQuery({
    queryKey: ["public-quote", token],
    queryFn: () => api.public.quote(token),
    enabled: Boolean(token),
    refetchInterval: (query) =>
      POLL_STATUSES.includes(query.state.data?.status as QuoteStatus)
        ? 4000
        : false,
  });

  useEffect(() => {
    const status = quoteQuery.data?.status;
    if (status && previousStatus.current && previousStatus.current !== status) {
      setStampKey((value) => value + 1);
    }
    if (status) previousStatus.current = status;
  }, [quoteQuery.data?.status]);

  if (quoteQuery.isLoading) {
    return (
      <main className="mx-auto max-w-md px-4 py-10">
        <Skeleton className="h-40" />
      </main>
    );
  }
  if (quoteQuery.isError || !quoteQuery.data) {
    return (
      <main className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold">Orçamento não encontrado</h1>
      </main>
    );
  }

  const quote = quoteQuery.data;
  const animate = stampKey > 0;

  return (
    <main className="mx-auto max-w-md px-4 py-10">
      <h1 className="text-2xl font-semibold">
        Orçamento de {quote.provider.businessName}
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Cliente: {quote.customer.name}
      </p>

      {isStamped(quote.status) ? (
        <div className="mt-6 flex justify-center" key={stampKey}>
          <Carimbo
            size="md"
            animate={animate}
            label={
              quote.status === "scheduled"
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
      ) : (
        <p className="mt-4 font-mono text-xs uppercase text-muted-foreground">
          {STATUS_LABEL[quote.status]}
        </p>
      )}

      <QuoteItems quote={quote} />

      {quote.status === "sent" || quote.status === "viewed" ? (
        <AcceptForm
          token={token}
          onDone={() =>
            queryClient.invalidateQueries({ queryKey: ["public-quote", token] })
          }
        />
      ) : null}

      {quote.status === "accepted" ? (
        <ContractPanel
          quote={quote}
          token={token}
          onDone={() =>
            queryClient.invalidateQueries({ queryKey: ["public-quote", token] })
          }
        />
      ) : null}

      {quote.status === "awaiting_payment" || quote.status === "contracted" ? (
        <PixPanel quote={quote} />
      ) : null}

      {quote.status === "paid" ? (
        <SlotsPanel
          quote={quote}
          token={token}
          onDone={() =>
            queryClient.invalidateQueries({ queryKey: ["public-quote", token] })
          }
        />
      ) : null}

      {quote.status === "scheduled" || quote.status === "completed" ? (
        <DonePanel token={token} quote={quote} />
      ) : null}
    </main>
  );
}

function QuoteItems({ quote }: { quote: PublicQuote }) {
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
      {quote.expiresAt ? (
        <p className="mt-2 font-mono text-xs text-muted-foreground">
          Válido até {formatDate(quote.expiresAt)}
        </p>
      ) : null}
    </Card>
  );
}

function AcceptForm({ token, onDone }: { token: string; onDone: () => void }) {
  const [pending, setPending] = useState(false);
  async function onSubmit(formData: FormData) {
    const name = String(formData.get("name") ?? "");
    const cpf = String(formData.get("cpf") ?? "");
    setPending(true);
    try {
      await api.public.acceptQuote(token, { name, cpf });
      onDone();
    } catch {
      toast.error("Não foi possível aceitar o orçamento.");
    } finally {
      setPending(false);
    }
  }
  return (
    <form action={onSubmit} className="mt-6 grid gap-4">
      <Field label="Seu nome" htmlFor="name">
        <Input id="name" name="name" required minLength={2} />
      </Field>
      <Field label="CPF" htmlFor="cpf">
        <Input id="cpf" name="cpf" inputMode="numeric" required />
      </Field>
      <Button
        type="submit"
        variant="accent"
        className="h-11"
        disabled={pending}
      >
        {pending ? "Aceitando..." : "Aceitar orçamento"}
      </Button>
    </form>
  );
}

function ContractPanel({
  quote,
  token,
  onDone,
}: {
  quote: PublicQuote;
  token: string;
  onDone: () => void;
}) {
  const mutation = useMutation({
    mutationFn: () => api.public.acceptContract(token),
    onSuccess: onDone,
    onError: () => toast.error("Não foi possível aceitar o contrato."),
  });
  const terms =
    quote.contractTerms ??
    "O prestador executará os serviços descritos no orçamento aceito, conforme valores, prazos e condições acordados.";
  return (
    <div className="mt-6 grid gap-4">
      <Card className="p-4 text-sm leading-relaxed">{terms}</Card>
      <Button
        variant="accent"
        className="h-11"
        disabled={mutation.isPending}
        onClick={() => mutation.mutate()}
      >
        {mutation.isPending ? "Confirmando..." : "Aceitar contrato"}
      </Button>
    </div>
  );
}

function PixPanel({ quote }: { quote: PublicQuote }) {
  const automaticPix = quote.payment?.pixCode;
  const pix = automaticPix ?? quote.provider.pixKey;
  const [waiting, setWaiting] = useState(false);
  if (!pix) {
    return (
      <p className="mt-6 text-sm text-muted-foreground">
        Aguardando a chave PIX do prestador.
      </p>
    );
  }
  return (
    <div className="mt-6 grid justify-items-center gap-4">
      <QRCodeSVG value={pix} size={180} />
      <p className="font-mono text-xs uppercase text-primary">
        {automaticPix ? "PIX Mercado Pago" : "PIX manual"}
      </p>
      <p className="break-all font-mono text-sm">{pix}</p>
      <Button
        variant="outline"
        onClick={() => {
          void navigator.clipboard.writeText(pix);
          toast.success("Chave copiada.");
        }}
      >
        Copiar chave PIX
      </Button>
      {quote.payment?.ticketUrl ? (
        <Button asChild variant="outline">
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
      {waiting ? (
        <p className="text-sm text-muted-foreground">
          Aguardando confirmação do pagamento...
        </p>
      ) : null}
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
  const offered = quote.appointments.filter(
    (item) => item.status === "offered",
  );
  const mutation = useMutation({
    mutationFn: (id: string) => api.public.selectAppointment(token, id),
    onSuccess: onDone,
    onError: () => toast.error("Horário indisponível."),
  });
  if (offered.length === 0) {
    return (
      <p className="mt-6 text-sm text-muted-foreground">
        Aguardando horários do prestador.
      </p>
    );
  }
  return (
    <div className="mt-6 grid gap-3">
      {offered.map((slot) => (
        <button
          key={slot.id}
          type="button"
          className="rounded-md border bg-card p-4 text-left font-mono hover:border-primary"
          onClick={() => mutation.mutate(slot.id)}
          disabled={mutation.isPending}
        >
          {formatDateTime(slot.startsAt)}
        </button>
      ))}
    </div>
  );
}

function DonePanel({ token, quote }: { token: string; quote: PublicQuote }) {
  async function download() {
    try {
      const { downloadUrl } = await api.public.contractDownload(token);
      window.location.href = downloadUrl;
    } catch {
      toast.error("Contrato ainda não está disponível.");
    }
  }
  const slot = selectedSlot(quote);
  return (
    <div className="mt-6 grid gap-3">
      {slot ? (
        <p className="text-sm">
          Agendado para <Timestamp iso={slot} />
        </p>
      ) : null}
      <Button variant="outline" onClick={download}>
        Baixar contrato em PDF
      </Button>
    </div>
  );
}

function selectedSlot(quote: PublicQuote) {
  return quote.appointments.find((item) => item.status === "selected")
    ?.startsAt;
}
