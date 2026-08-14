"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/src/lib/api/client";
import { useAccessToken } from "@/hooks/use-access-token";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/field";
import { Money } from "@/components/money";
import { reaisToCents } from "@/lib/format";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/empty-state";
import type { ServiceRow } from "@/src/lib/api/types";

function centsToInput(cents: number | null) {
  if (cents == null) return "";
  return (cents / 100).toFixed(2).replace(".", ",");
}

export default function AppServicesPage() {
  const { token, ready } = useAccessToken();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [duration, setDuration] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editDuration, setEditDuration] = useState("");
  const services = useQuery({
    queryKey: ["services", token],
    queryFn: () => api.provider.services(token!),
    enabled: ready && Boolean(token),
  });

  function durationMinutes(value: string) {
    if (!value.trim()) return null;
    const minutes = Number(value);
    return Number.isFinite(minutes) && minutes > 0 ? Math.round(minutes) : null;
  }

  const create = useMutation({
    mutationFn: () =>
      api.provider.createService(token!, {
        name,
        priceCents: price ? reaisToCents(price) : null,
        durationMinutes: durationMinutes(duration),
      }),
    onSuccess: () => {
      setName("");
      setPrice("");
      setDuration("");
      void queryClient.invalidateQueries({ queryKey: ["services"] });
    },
    onError: () => toast.error("Não foi possível criar o serviço."),
  });

  function startEdit(service: ServiceRow) {
    setEditingId(service.id);
    setEditName(service.name);
    setEditPrice(centsToInput(service.price_cents));
    setEditDuration(
      service.duration_minutes != null ? String(service.duration_minutes) : "",
    );
  }

  async function saveEdit(id: string) {
    if (!token) return;
    try {
      await api.provider.updateService(token, id, {
        name: editName,
        priceCents: editPrice ? reaisToCents(editPrice) : null,
        durationMinutes: durationMinutes(editDuration),
      });
      setEditingId(null);
      void queryClient.invalidateQueries({ queryKey: ["services"] });
    } catch {
      toast.error("Não foi possível atualizar o serviço.");
    }
  }

  if (!ready || services.isLoading) return <Skeleton className="h-64" />;

  const rows = services.data?.data ?? [];

  return (
    <div className="grid gap-8">
      <div>
        <h1 className="text-2xl font-semibold">Serviços</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Cadastre uma vez e reutilize em qualquer fechamento.
        </p>
      </div>
      <form
        className="grid max-w-2xl gap-3 md:grid-cols-[1fr_8rem_7rem_auto]"
        onSubmit={(event) => {
          event.preventDefault();
          create.mutate();
        }}
      >
        <Field label="Nome" htmlFor="service-name">
          <Input
            id="service-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            minLength={2}
          />
        </Field>
        <Field label="Preço" htmlFor="service-price">
          <Input
            id="service-price"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="120"
          />
        </Field>
        <Field label="Duração (min)" htmlFor="service-duration">
          <Input
            id="service-duration"
            inputMode="numeric"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            placeholder="60"
          />
        </Field>
        <Button
          type="submit"
          variant="accent"
          className="self-end"
          disabled={create.isPending}
        >
          Adicionar
        </Button>
      </form>
      {rows.length === 0 ? (
        <EmptyState
          title="Cadastre uma vez e reutilize em qualquer fechamento."
          body="Nome, preço, duração e o que o cliente precisa saber."
        />
      ) : (
        <div className="overflow-x-auto rounded-md border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Preço</TableHead>
                <TableHead>Duração</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((service) => (
                <TableRow key={service.id}>
                  {editingId === service.id ? (
                    <>
                      <TableCell>
                        <Input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={editPrice}
                          onChange={(e) => setEditPrice(e.target.value)}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          inputMode="numeric"
                          value={editDuration}
                          onChange={(e) => setEditDuration(e.target.value)}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="accent" onClick={() => void saveEdit(service.id)}>
                          Salvar
                        </Button>
                        <Button variant="ghost" onClick={() => setEditingId(null)}>
                          Cancelar
                        </Button>
                      </TableCell>
                    </>
                  ) : (
                    <>
                      <TableCell>{service.name}</TableCell>
                      <TableCell>
                        {service.price_cents != null ? (
                          <Money cents={service.price_cents} />
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell>
                        {service.duration_minutes != null
                          ? `${service.duration_minutes} min`
                          : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" onClick={() => startEdit(service)}>
                          Editar
                        </Button>
                        <Button
                          variant="ghost"
                          onClick={async () => {
                            if (!token) return;
                            await api.provider.deleteService(token, service.id);
                            void queryClient.invalidateQueries({
                              queryKey: ["services"],
                            });
                          }}
                        >
                          Excluir
                        </Button>
                      </TableCell>
                    </>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
