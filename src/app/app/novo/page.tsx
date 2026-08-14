"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useFieldArray, useForm } from "react-hook-form";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/src/lib/api/client";
import type { CustomerRow, ServiceRow } from "@/src/lib/api/types";
import { useAccessToken } from "@/hooks/use-access-token";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Field } from "@/components/field";
import { EmptyState } from "@/components/empty-state";
import { Money, formatBRL, formatDateTime } from "@/components/money";
import { publicClosingUrl, reaisToCents } from "@/lib/format";
import { interpolate, MESSAGE_TEMPLATES } from "@/lib/messages";
import { whatsappUrl } from "@/src/lib/whatsapp";
import { cn } from "@/lib/utils";

const STEPS = [
  "Cliente",
  "Serviços",
  "Pagamento",
  "Agendamento",
  "Revisar",
] as const;

const PAYMENT_LABEL = {
  none: "Nenhum pagamento antecipado",
  deposit: "Sinal",
  full: "Pagamento integral",
} as const;

const SCHEDULE_LABEL = {
  client_picks: "Escolher pelo link",
  now: "Definir agora",
  later: "Combinar depois",
} as const;

type PaymentMode = keyof typeof PAYMENT_LABEL;
type ScheduleMode = keyof typeof SCHEDULE_LABEL;

type LineItem = {
  serviceId?: string;
  name: string;
  quantity: string;
  unitPrice: string;
  notes: string;
  duration: string;
};

type FormValues = {
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  saveCustomer: boolean;
  items: LineItem[];
  discount: string;
  paymentMode: PaymentMode;
  depositAmount: string;
  scheduleMode: ScheduleMode;
  scheduledAt: string;
};

type CreatedClosing = {
  id: string;
  publicToken: string;
  customerName: string;
  customerPhone: string;
};

function emptyItem(): LineItem {
  return {
    serviceId: undefined,
    name: "",
    quantity: "1",
    unitPrice: "",
    notes: "",
    duration: "",
  };
}

function centsToReaisInput(cents: number) {
  return (cents / 100).toFixed(2).replace(".", ",");
}

function lineTotalCents(item: LineItem) {
  const unit = reaisToCents(item.unitPrice) ?? 0;
  const quantity = Number(item.quantity);
  if (!Number.isFinite(quantity) || quantity <= 0) return 0;
  return Math.round(unit * quantity);
}

function quoteTitle(items: LineItem[]) {
  const names = items.map((item) => item.name.trim()).filter(Boolean);
  const title = names.join(" + ");
  return title.slice(0, 200) || "Fechamento";
}

function itemDescription(item: LineItem) {
  const name = item.name.trim();
  const duration = item.duration.trim();
  const notes = item.notes.trim();
  let description = duration ? `${name} · ${duration}` : name;
  if (notes) description = `${description}\n${notes}`;
  return description.slice(0, 500);
}

function buildMessage(values: FormValues, totals: { total: number }) {
  const lines: string[] = [];
  if (values.paymentMode === "deposit") {
    const depositCents = reaisToCents(values.depositAmount) ?? 0;
    lines.push(`Sinal: ${formatBRL(depositCents)}`);
    lines.push("Forma: Pix");
  } else if (values.paymentMode === "full") {
    lines.push(`Pagamento integral: ${formatBRL(totals.total)}`);
    lines.push("Forma: Pix");
  } else {
    lines.push(
      "Pagamento: nenhum antecipado. Cliente aceita e agenda sem pagar agora.",
    );
  }
  if (values.scheduleMode === "now" && values.scheduledAt) {
    const at = new Date(values.scheduledAt);
    lines.push(
      `Agendamento: ${Number.isNaN(at.getTime()) ? values.scheduledAt : formatDateTime(at.toISOString())}`,
    );
  } else if (values.scheduleMode === "client_picks") {
    lines.push("Agendamento: cliente escolhe pelo link");
  } else {
    lines.push("Agendamento: combinar depois");
  }
  return lines.join("\n").slice(0, 2000);
}

export default function NewClosingPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { token, ready } = useAccessToken();
  const [step, setStep] = useState(0);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customPrice, setCustomPrice] = useState("");
  const [saving, setSaving] = useState<"draft" | "send" | null>(null);
  const [created, setCreated] = useState<CreatedClosing | null>(null);
  const prefilling = useRef(false);

  const form = useForm<FormValues>({
    defaultValues: {
      customerName: "",
      customerPhone: "",
      customerEmail: "",
      saveCustomer: true,
      items: [],
      discount: "",
      paymentMode: "none",
      depositAmount: "",
      scheduleMode: "client_picks",
      scheduledAt: "",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const customers = useQuery({
    queryKey: ["customers", token],
    queryFn: () => api.provider.customers(token!),
    enabled: ready && Boolean(token),
  });
  const services = useQuery({
    queryKey: ["services", token],
    queryFn: () => api.provider.services(token!),
    enabled: ready && Boolean(token),
  });

  const watchedItems = form.watch("items");
  const watchedDiscount = form.watch("discount");
  const paymentMode = form.watch("paymentMode");
  const scheduleMode = form.watch("scheduleMode");
  const saveCustomer = form.watch("saveCustomer");

  const totals = useMemo(() => {
    const subtotal = (watchedItems ?? []).reduce(
      (sum, item) => sum + lineTotalCents(item),
      0,
    );
    const discount = reaisToCents(watchedDiscount ?? "") ?? 0;
    return {
      subtotal,
      discount,
      total: Math.max(0, subtotal - discount),
    };
  }, [watchedItems, watchedDiscount]);

  const customerList = customers.data?.data ?? [];
  const catalog = (services.data?.data ?? []).filter((service) => service.active);

  useEffect(() => {
    if (prefilling.current || customerList.length === 0) return;
    const clienteId = new URLSearchParams(window.location.search).get("cliente");
    if (!clienteId) return;
    const match = customerList.find((row) => row.id === clienteId);
    if (!match) return;
    prefilling.current = true;
    form.setValue("customerName", match.name);
    form.setValue("customerPhone", match.phone);
    form.setValue("customerEmail", match.email ?? "");
  }, [customerList, form.setValue]);

  function selectCustomer(customer: CustomerRow) {
    form.setValue("customerName", customer.name);
    form.setValue("customerPhone", customer.phone);
    form.setValue("customerEmail", customer.email ?? "");
    form.clearErrors(["customerName", "customerPhone", "customerEmail"]);
  }

  function addFromCatalog(service: ServiceRow) {
    append({
      serviceId: service.id,
      name: service.name,
      quantity: "1",
      unitPrice:
        service.price_cents != null ? centsToReaisInput(service.price_cents) : "",
      notes: service.description ?? "",
      duration: "",
    });
    setPickerOpen(false);
  }

  function addCustomService() {
    const name = customName.trim();
    if (!name) {
      toast.error("Informe o nome do serviço.");
      return;
    }
    const cents = reaisToCents(customPrice);
    if (cents == null || cents <= 0) {
      toast.error("Informe um valor válido.");
      return;
    }
    append({
      ...emptyItem(),
      name,
      unitPrice: customPrice,
    });
    setCustomName("");
    setCustomPrice("");
    setPickerOpen(false);
  }

  function goTo(index: number) {
    if (index <= step) setStep(index);
  }

  async function goNext() {
    if (step === 0) {
      const nameOk = await form.trigger("customerName");
      const phoneOk = await form.trigger("customerPhone");
      const emailOk = await form.trigger("customerEmail");
      const name = form.getValues("customerName").trim();
      const phone = form.getValues("customerPhone").trim();
      const email = form.getValues("customerEmail").trim();
      let valid = nameOk && phoneOk && emailOk;
      if (name.length < 2) {
        form.setError("customerName", { message: "Informe o nome." });
        valid = false;
      }
      if (phone.length < 8) {
        form.setError("customerPhone", { message: "Informe o WhatsApp." });
        valid = false;
      }
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        form.setError("customerEmail", { message: "E-mail inválido." });
        valid = false;
      }
      if (!valid) return;
    }

    if (step === 1) {
      const items = form.getValues("items");
      if (items.length === 0) {
        toast.error("Adicione pelo menos um serviço.");
        return;
      }
      let valid = true;
      items.forEach((item, index) => {
        if (!item.name.trim()) {
          form.setError(`items.${index}.name`, {
            message: "Informe o nome do serviço.",
          });
          valid = false;
        }
        const quantity = Number(item.quantity);
        if (!Number.isFinite(quantity) || quantity <= 0) {
          form.setError(`items.${index}.quantity`, {
            message: "Quantidade inválida.",
          });
          valid = false;
        }
        const cents = reaisToCents(item.unitPrice);
        if (cents == null || cents <= 0) {
          form.setError(`items.${index}.unitPrice`, {
            message: "Informe um valor válido.",
          });
          valid = false;
        }
      });
      if (totals.discount > totals.subtotal) {
        form.setError("discount", {
          message: "O desconto não pode ser maior que o subtotal.",
        });
        valid = false;
      }
      if (!valid) return;
    }

    if (step === 2 && form.getValues("paymentMode") === "deposit") {
      const depositCents = reaisToCents(form.getValues("depositAmount"));
      if (depositCents == null || depositCents <= 0) {
        form.setError("depositAmount", {
          message: "Informe o valor do sinal.",
        });
        return;
      }
      if (depositCents > totals.total) {
        form.setError("depositAmount", {
          message: "O sinal não pode ser maior que o total.",
        });
        return;
      }
    }

    if (step === 3 && form.getValues("scheduleMode") === "now") {
      const scheduledAt = form.getValues("scheduledAt");
      if (!scheduledAt) {
        form.setError("scheduledAt", { message: "Escolha data e horário." });
        return;
      }
    }

    setStep((current) => Math.min(current + 1, STEPS.length - 1));
  }

  async function persist(mode: "draft" | "send") {
    if (!token) {
      toast.error("Entre novamente para criar o fechamento.");
      return;
    }
    const values = form.getValues();
    if (values.items.length === 0) {
      toast.error("Adicione pelo menos um serviço.");
      setStep(1);
      return;
    }
    const title = quoteTitle(values.items);
    const email = values.customerEmail.trim();
    const expires = new Date();
    expires.setDate(expires.getDate() + 7);
    const message = buildMessage(values, totals);
    setSaving(mode);
    try {
      const quote = await api.provider.createQuote(token, {
        customer: {
          name: values.customerName.trim(),
          phone: values.customerPhone.trim(),
          ...(email ? { email } : {}),
        },
        title,
        message,
      });
      await api.provider.replaceItems(token, quote.id, {
        title,
        discountCents: totals.discount,
        expiresAt: expires.toISOString(),
        items: values.items.map((item, index) => ({
          serviceId: item.serviceId || undefined,
          description: itemDescription(item),
          quantity: Number(item.quantity) || 1,
          unitPriceCents: reaisToCents(item.unitPrice) ?? 0,
          sortOrder: index,
        })),
      });
      void queryClient.invalidateQueries({ queryKey: ["quotes"] });
      void queryClient.invalidateQueries({ queryKey: ["customers"] });
      if (mode === "send") {
        await api.provider.transition(token, quote.id, "sent");
        setCreated({
          id: quote.id,
          publicToken: quote.public_token,
          customerName: values.customerName.trim(),
          customerPhone: values.customerPhone.trim(),
        });
      } else {
        toast.success("Rascunho salvo.");
        router.push(`/app/fechamentos/${quote.id}`);
      }
    } catch {
      toast.error(
        mode === "send"
          ? "Não foi possível criar e enviar o fechamento."
          : "Não foi possível salvar o rascunho.",
      );
    } finally {
      setSaving(null);
    }
  }

  if (created) {
    const link = publicClosingUrl(created.publicToken);
    const message = interpolate(MESSAGE_TEMPLATES.novaProposta, {
      cliente: created.customerName,
      link,
    });
    return (
      <div className="mx-auto grid max-w-lg gap-6">
        <div>
          <h1 className="text-2xl font-semibold">Fechamento criado</h1>
          <p className="mt-2 text-muted-foreground">
            Agora é só enviar o link para {created.customerName}.
          </p>
        </div>
        <Card className="gap-3 p-5">
          <p className="break-all font-mono text-sm">{link}</p>
          <div className="grid gap-3">
            <Button asChild variant="accent" className="h-11">
              <a
                href={whatsappUrl(created.customerPhone, message)}
                target="_blank"
                rel="noreferrer"
              >
                Enviar no WhatsApp
              </a>
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-11"
              onClick={() => {
                void navigator.clipboard.writeText(link);
                toast.success("Link copiado.");
              }}
            >
              Copiar link
            </Button>
          </div>
        </Card>
        <p className="text-sm text-muted-foreground">
          Você poderá acompanhar visualizações, aceite, pagamento e agendamento
          por aqui.
        </p>
        <Button asChild variant="accent" className="h-11 w-fit">
          <Link href={`/app/fechamentos/${created.id}`}>Ver fechamento</Link>
        </Button>
      </div>
    );
  }

  const heading = [
    "Para quem é esse serviço?",
    "O que você está fechando?",
    "Como você quer receber?",
    "Como o cliente escolhe o horário?",
    "Tudo certo?",
  ][step];

  return (
    <div className="mx-auto grid max-w-lg gap-8">
      <div>
        <h1 className="text-2xl font-semibold">Novo fechamento</h1>
        <nav
          className="mt-3 flex flex-wrap items-center gap-x-1 text-sm"
          aria-label="Etapas"
        >
          {STEPS.map((label, index) => (
            <span key={label} className="flex items-center gap-1">
              {index > 0 ? (
                <span className="text-muted-foreground">·</span>
              ) : null}
              <button
                type="button"
                onClick={() => goTo(index)}
                disabled={index > step}
                className={cn(
                  "rounded-sm px-0.5",
                  index === step
                    ? "font-semibold text-foreground"
                    : index < step
                      ? "text-muted-foreground hover:text-foreground"
                      : "cursor-default text-muted-foreground/60",
                )}
              >
                {label}
              </button>
            </span>
          ))}
        </nav>
        <h2 className="mt-6 text-lg font-medium">{heading}</h2>
      </div>

      {step === 0 ? (
        <div className="grid gap-5">
          {customerList.length > 0 ? (
            <div className="grid gap-2">
              <p className="text-sm font-medium">Selecionar cliente existente</p>
              <div className="grid max-h-48 gap-2 overflow-y-auto">
                {customerList.map((customer) => (
                  <button
                    key={customer.id}
                    type="button"
                    className="flex flex-col rounded-lg border bg-card px-3 py-2 text-left text-sm hover:bg-muted"
                    onClick={() => selectCustomer(customer)}
                  >
                    <span className="font-medium">{customer.name}</span>
                    <span className="text-muted-foreground">{customer.phone}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : null}
          <Field
            label="Nome"
            htmlFor="customerName"
            error={form.formState.errors.customerName?.message}
          >
            <Input
              id="customerName"
              placeholder="Ex.: Mariana Costa"
              autoComplete="name"
              {...form.register("customerName")}
            />
          </Field>
          <Field
            label="WhatsApp"
            htmlFor="customerPhone"
            error={form.formState.errors.customerPhone?.message}
          >
            <Input
              id="customerPhone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="(11) 99999-9999"
              {...form.register("customerPhone")}
            />
          </Field>
          <Field
            label="E-mail (opcional)"
            htmlFor="customerEmail"
            error={form.formState.errors.customerEmail?.message}
          >
            <Input
              id="customerEmail"
              type="email"
              autoComplete="email"
              placeholder="mariana@email.com"
              {...form.register("customerEmail")}
            />
          </Field>
          <div className="flex items-center gap-2">
            <Checkbox
              id="saveCustomer"
              checked={saveCustomer}
              onCheckedChange={(value) =>
                form.setValue("saveCustomer", value === true)
              }
            />
            <Label htmlFor="saveCustomer" className="font-normal">
              Salvar cliente para usar novamente
            </Label>
          </div>
          <Button
            type="button"
            variant="accent"
            className="h-11"
            onClick={() => void goNext()}
          >
            Continuar
          </Button>
        </div>
      ) : null}

      {step === 1 ? (
        <div className="grid gap-5">
          {fields.length === 0 ? (
            <EmptyState
              title="Nenhum serviço ainda"
              body="Escolha do catálogo ou adicione um serviço com nome e valor."
            />
          ) : (
            <div className="grid gap-3">
              {fields.map((field, index) => (
                <Card key={field.id} className="gap-3 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <Field
                      className="flex-1"
                      label="Serviço"
                      htmlFor={`item-name-${index}`}
                      error={form.formState.errors.items?.[index]?.name?.message}
                    >
                      <Input
                        id={`item-name-${index}`}
                        {...form.register(`items.${index}.name`)}
                      />
                    </Field>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="mt-6"
                      aria-label="Remover serviço"
                      onClick={() => remove(index)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Field
                      label="Quantidade"
                      htmlFor={`item-qty-${index}`}
                      error={
                        form.formState.errors.items?.[index]?.quantity?.message
                      }
                    >
                      <Input
                        id={`item-qty-${index}`}
                        type="number"
                        min={1}
                        step={1}
                        {...form.register(`items.${index}.quantity`)}
                      />
                    </Field>
                    <Field
                      label="Valor"
                      htmlFor={`item-price-${index}`}
                      error={
                        form.formState.errors.items?.[index]?.unitPrice?.message
                      }
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm">R$</span>
                        <Input
                          id={`item-price-${index}`}
                          inputMode="decimal"
                          placeholder="0,00"
                          {...form.register(`items.${index}.unitPrice`)}
                        />
                      </div>
                    </Field>
                  </div>
                  <Field
                    label="Duração (opcional)"
                    htmlFor={`item-duration-${index}`}
                  >
                    <Input
                      id={`item-duration-${index}`}
                      placeholder="Ex.: 1h30"
                      {...form.register(`items.${index}.duration`)}
                    />
                  </Field>
                  <Field
                    label="Descrição (opcional)"
                    htmlFor={`item-notes-${index}`}
                  >
                    <Textarea
                      id={`item-notes-${index}`}
                      placeholder="Detalhes para o cliente"
                      {...form.register(`items.${index}.notes`)}
                    />
                  </Field>
                </Card>
              ))}
            </div>
          )}

          {pickerOpen ? (
            <Card className="gap-4 p-4">
              {catalog.length > 0 ? (
                <div className="grid gap-2">
                  <p className="text-sm font-medium">Do catálogo</p>
                  <div className="grid max-h-48 gap-2 overflow-y-auto">
                    {catalog.map((service) => (
                      <button
                        key={service.id}
                        type="button"
                        className="flex items-center justify-between rounded-lg border px-3 py-2 text-left text-sm hover:bg-muted"
                        onClick={() => addFromCatalog(service)}
                      >
                        <span>{service.name}</span>
                        <span className="font-mono text-muted-foreground">
                          {service.price_cents != null
                            ? formatBRL(service.price_cents)
                            : "—"}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <EmptyState
                  title="Catálogo vazio"
                  body="Você pode adicionar um serviço avulso abaixo, ou cadastrar no menu Serviços."
                  cta="Ir para Serviços"
                  href="/app/servicos"
                />
              )}
              <div className="grid gap-3">
                <p className="text-sm font-medium">Serviço avulso</p>
                <div className="grid gap-3 sm:grid-cols-[1fr_8rem]">
                  <Field label="Nome" htmlFor="custom-name">
                    <Input
                      id="custom-name"
                      placeholder="Ex.: Coloração"
                      value={customName}
                      onChange={(event) => setCustomName(event.target.value)}
                    />
                  </Field>
                  <Field label="Valor" htmlFor="custom-price">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm">R$</span>
                      <Input
                        id="custom-price"
                        inputMode="decimal"
                        placeholder="0,00"
                        value={customPrice}
                        onChange={(event) => setCustomPrice(event.target.value)}
                      />
                    </div>
                  </Field>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="accent"
                    onClick={addCustomService}
                  >
                    Adicionar
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setPickerOpen(false)}
                  >
                    Fechar
                  </Button>
                </div>
              </div>
            </Card>
          ) : (
            <Button
              type="button"
              variant="outline"
              onClick={() => setPickerOpen(true)}
            >
              <Plus className="size-4" />
              Adicionar serviço
            </Button>
          )}

          <Field
            label="Desconto"
            htmlFor="discount"
            error={form.formState.errors.discount?.message}
          >
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm">R$</span>
              <Input
                id="discount"
                inputMode="decimal"
                placeholder="0,00"
                {...form.register("discount")}
              />
            </div>
          </Field>

          <Card className="gap-2 p-4 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <Money cents={totals.subtotal} />
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Desconto</span>
              <Money cents={totals.discount} />
            </div>
            <div className="flex justify-between font-medium">
              <span>Total</span>
              <Money cents={totals.total} />
            </div>
          </Card>

          <div className="grid gap-3 sm:grid-cols-2">
            <Button type="button" variant="outline" onClick={() => setStep(0)}>
              Voltar
            </Button>
            <Button
              type="button"
              variant="accent"
              className="h-11"
              onClick={() => void goNext()}
            >
              Continuar
            </Button>
          </div>
        </div>
      ) : null}

      {step === 2 ? (
        <div className="grid gap-5">
          <RadioGroup
            value={paymentMode}
            onValueChange={(value) =>
              form.setValue("paymentMode", value as PaymentMode)
            }
            className="grid gap-3"
          >
            {(
              [
                [
                  "none",
                  "Nenhum pagamento antecipado",
                  "Cliente aceita e agenda sem pagar agora.",
                ],
                ["deposit", "Sinal", "O cliente paga um valor agora para reservar."],
                [
                  "full",
                  "Pagamento integral",
                  "O cliente paga o valor total pelo link.",
                ],
              ] as const
            ).map(([value, title, body]) => (
              <label
                key={value}
                htmlFor={`pay-${value}`}
                className={cn(
                  "flex cursor-pointer items-start gap-3 rounded-xl p-4 ring-1 ring-foreground/10",
                  paymentMode === value && "ring-2 ring-primary",
                )}
              >
                <RadioGroupItem value={value} id={`pay-${value}`} />
                <span className="grid gap-1">
                  <span className="text-sm font-medium">{title}</span>
                  <span className="text-sm text-muted-foreground">{body}</span>
                </span>
              </label>
            ))}
          </RadioGroup>

          {paymentMode === "deposit" ? (
            <Field
              label="Valor do sinal"
              htmlFor="depositAmount"
              error={form.formState.errors.depositAmount?.message}
            >
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm">R$</span>
                <Input
                  id="depositAmount"
                  inputMode="decimal"
                  placeholder="0,00"
                  {...form.register("depositAmount")}
                />
              </div>
            </Field>
          ) : null}

          {paymentMode !== "none" ? (
            <p className="text-sm text-muted-foreground">Forma: Pix</p>
          ) : null}

          <div className="grid gap-3 sm:grid-cols-2">
            <Button type="button" variant="outline" onClick={() => setStep(1)}>
              Voltar
            </Button>
            <Button
              type="button"
              variant="accent"
              className="h-11"
              onClick={() => void goNext()}
            >
              Continuar
            </Button>
          </div>
        </div>
      ) : null}

      {step === 3 ? (
        <div className="grid gap-5">
          <RadioGroup
            value={scheduleMode}
            onValueChange={(value) =>
              form.setValue("scheduleMode", value as ScheduleMode)
            }
            className="grid gap-3"
          >
            {(
              [
                [
                  "client_picks",
                  "Escolher pelo link",
                  "O cliente escolhe o horário na página do fechamento.",
                ],
                [
                  "now",
                  "Definir agora",
                  "Você já sabe o dia e a hora do atendimento.",
                ],
                [
                  "later",
                  "Combinar depois",
                  "Vocês combinam o horário depois do aceite.",
                ],
              ] as const
            ).map(([value, title, body]) => (
              <label
                key={value}
                htmlFor={`schedule-${value}`}
                className={cn(
                  "flex cursor-pointer items-start gap-3 rounded-xl p-4 ring-1 ring-foreground/10",
                  scheduleMode === value && "ring-2 ring-primary",
                )}
              >
                <RadioGroupItem value={value} id={`schedule-${value}`} />
                <span className="grid gap-1">
                  <span className="text-sm font-medium">{title}</span>
                  <span className="text-sm text-muted-foreground">{body}</span>
                </span>
              </label>
            ))}
          </RadioGroup>

          {scheduleMode === "now" ? (
            <Field
              label="Data e horário"
              htmlFor="scheduledAt"
              error={form.formState.errors.scheduledAt?.message}
            >
              <Input
                id="scheduledAt"
                type="datetime-local"
                {...form.register("scheduledAt")}
              />
            </Field>
          ) : null}

          <div className="grid gap-3 sm:grid-cols-2">
            <Button type="button" variant="outline" onClick={() => setStep(2)}>
              Voltar
            </Button>
            <Button
              type="button"
              variant="accent"
              className="h-11"
              onClick={() => void goNext()}
            >
              Continuar
            </Button>
          </div>
        </div>
      ) : null}

      {step === 4 ? (
        <div className="grid gap-5">
          <Card className="gap-4 p-5">
            <div>
              <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                Cliente
              </p>
              <p className="font-medium">{form.getValues("customerName")}</p>
              <p className="text-sm text-muted-foreground">
                {form.getValues("customerPhone")}
                {form.getValues("customerEmail").trim()
                  ? ` · ${form.getValues("customerEmail").trim()}`
                  : ""}
              </p>
            </div>
            <div className="grid gap-2">
              <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                Serviços
              </p>
              {(watchedItems ?? []).map((item, index) => (
                <div key={`${item.name}-${index}`} className="flex justify-between gap-3 text-sm">
                  <span>
                    {item.name}
                    {Number(item.quantity) !== 1 ? ` × ${item.quantity}` : ""}
                    {item.duration.trim() ? ` · ${item.duration}` : ""}
                  </span>
                  <Money cents={lineTotalCents(item)} />
                </div>
              ))}
            </div>
            <div className="grid gap-1 border-t pt-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <Money cents={totals.subtotal} />
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Desconto</span>
                <Money cents={totals.discount} />
              </div>
              <div className="flex justify-between font-medium">
                <span>Total</span>
                <Money cents={totals.total} />
              </div>
            </div>
            <div className="grid gap-1 text-sm">
              <p>
                <span className="text-muted-foreground">Pagamento: </span>
                {PAYMENT_LABEL[paymentMode]}
                {paymentMode === "deposit"
                  ? ` · ${formatBRL(reaisToCents(form.getValues("depositAmount")) ?? 0)}`
                  : ""}
                {paymentMode !== "none" ? " · Pix" : ""}
              </p>
              <p>
                <span className="text-muted-foreground">Agendamento: </span>
                {SCHEDULE_LABEL[scheduleMode]}
                {scheduleMode === "now" && form.getValues("scheduledAt")
                  ? ` · ${formatDateTime(new Date(form.getValues("scheduledAt")).toISOString())}`
                  : ""}
              </p>
              <p>
                <span className="text-muted-foreground">Validade da proposta: </span>
                {new Intl.DateTimeFormat("pt-BR", {
                  day: "numeric",
                  month: "long",
                }).format(new Date(Date.now() + 7 * 86_400_000))}
              </p>
            </div>
          </Card>

          <div className="grid gap-3">
            <Button
              type="button"
              variant="accent"
              className="h-11"
              disabled={saving !== null}
              onClick={() => void persist("send")}
            >
              {saving === "send" ? "Enviando..." : "Criar e enviar"}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-11"
              disabled={saving !== null}
              onClick={() => void persist("draft")}
            >
              {saving === "draft" ? "Salvando..." : "Salvar como rascunho"}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setStep(3)}>
              Voltar
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
