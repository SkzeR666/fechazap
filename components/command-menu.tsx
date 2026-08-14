"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { api } from "@/src/lib/api/client";
import { useAccessToken } from "@/hooks/use-access-token";
import { one } from "@/lib/format";
import { STATUS_LABEL } from "@/lib/status";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";

const ACTIONS = [
  { href: "/app/novo", label: "Criar fechamento" },
  { href: "/app/clientes", label: "Adicionar cliente" },
  { href: "/app/agenda", label: "Bloquear horário" },
  { href: "/app/financeiro", label: "Registrar pagamento" },
  { href: "/app/servicos", label: "Criar serviço" },
] as const;

export function CommandMenu() {
  const router = useRouter();
  const { token, ready } = useAccessToken();
  const [open, setOpen] = useState(false);

  const quotes = useQuery({
    queryKey: ["quotes", token],
    queryFn: () => api.provider.quotes(token!),
    enabled: open && ready && Boolean(token),
  });
  const customers = useQuery({
    queryKey: ["customers", token],
    queryFn: () => api.provider.customers(token!),
    enabled: open && ready && Boolean(token),
  });

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((value) => !value);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const quoteItems = useMemo(
    () =>
      (quotes.data?.data ?? []).slice(0, 8).map((quote) => {
        const customer = one(quote.customers);
        return {
          id: quote.id,
          label: `${customer?.name ?? "Cliente"} · ${quote.title ?? "Serviço"}`,
          hint: STATUS_LABEL[quote.status],
        };
      }),
    [quotes.data],
  );

  function go(href: string) {
    setOpen(false);
    router.push(href);
  }

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Buscar clientes e fechamentos"
        onClick={() => setOpen(true)}
      >
        <Search className="size-4" />
      </Button>
      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title="Buscar"
        description="Buscar clientes e fechamentos"
      >
        <Command>
          <CommandInput placeholder="Buscar clientes e fechamentos..." />
          <CommandList>
            <CommandEmpty>Nada encontrado.</CommandEmpty>
            <CommandGroup heading="Ações">
              {ACTIONS.map((action) => (
                <CommandItem
                  key={action.href}
                  value={action.label}
                  onSelect={() => go(action.href)}
                >
                  {action.label}
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="Fechamentos">
              {quoteItems.map((item) => (
                <CommandItem
                  key={item.id}
                  value={`${item.label} ${item.hint}`}
                  onSelect={() => go(`/app/fechamentos/${item.id}`)}
                >
                  <span className="truncate">{item.label}</span>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {item.hint}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandGroup heading="Clientes">
              {(customers.data?.data ?? []).slice(0, 8).map((customer) => (
                <CommandItem
                  key={customer.id}
                  value={`${customer.name} ${customer.phone}`}
                  onSelect={() => go(`/app/clientes/${customer.id}`)}
                >
                  {customer.name}
                  <span className="ml-auto font-mono text-xs text-muted-foreground">
                    {customer.phone}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  );
}
