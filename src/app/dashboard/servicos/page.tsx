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

export default function ServicesPage() {
  const { token, ready } = useAccessToken();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const services = useQuery({
    queryKey: ["services", token],
    queryFn: () => api.provider.services(token!),
    enabled: ready && Boolean(token),
  });
  const create = useMutation({
    mutationFn: () =>
      api.provider.createService(token!, {
        name,
        priceCents: price ? reaisToCents(price) : null,
      }),
    onSuccess: () => {
      setName("");
      setPrice("");
      void queryClient.invalidateQueries({ queryKey: ["services"] });
    },
    onError: () => toast.error("Não foi possível criar o serviço."),
  });

  if (!ready || services.isLoading) return <Skeleton className="h-64" />;

  return (
    <div className="grid gap-8">
      <h1 className="text-2xl font-semibold">Serviços</h1>
      <form
        className="grid max-w-lg gap-3 md:grid-cols-[1fr_8rem_auto]"
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
          />
        </Field>
        <Field label="Preço" htmlFor="service-price">
          <Input
            id="service-price"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
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
      <div className="overflow-x-auto rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Preço</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {(services.data?.data ?? []).map((service) => (
              <TableRow key={service.id}>
                <TableCell>{service.name}</TableCell>
                <TableCell>
                  {service.price_cents != null ? (
                    <Money cents={service.price_cents} />
                  ) : (
                    "—"
                  )}
                </TableCell>
                <TableCell className="text-right">
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
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
