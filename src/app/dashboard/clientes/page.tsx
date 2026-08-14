"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api, ApiError } from "@/src/lib/api/client";
import { useAccessToken } from "@/hooks/use-access-token";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/field";
import { Timestamp } from "@/components/money";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function CustomersPage() {
  const { token, ready } = useAccessToken();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const customers = useQuery({
    queryKey: ["customers", token],
    queryFn: () => api.provider.customers(token!),
    enabled: ready && Boolean(token),
  });
  const create = useMutation({
    mutationFn: () =>
      api.provider.createCustomer(token!, {
        name,
        phone,
        email: email || undefined,
      }),
    onSuccess: () => {
      setName("");
      setPhone("");
      setEmail("");
      void queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
    onError: (error) => {
      toast.error(
        error instanceof ApiError && error.status === 409
          ? "Já existe cliente com este WhatsApp."
          : "Não foi possível criar o cliente.",
      );
    },
  });

  if (!ready || customers.isLoading) return <Skeleton className="h-64" />;

  return (
    <div className="grid gap-8">
      <h1 className="text-2xl font-semibold">Clientes</h1>
      <form
        className="grid max-w-3xl gap-3 md:grid-cols-[1fr_10rem_1fr_auto]"
        onSubmit={(event) => {
          event.preventDefault();
          create.mutate();
        }}
      >
        <Field label="Nome" htmlFor="customer-name">
          <Input
            id="customer-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            minLength={2}
          />
        </Field>
        <Field label="WhatsApp" htmlFor="customer-phone">
          <Input
            id="customer-phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
            minLength={8}
          />
        </Field>
        <Field label="E-mail" htmlFor="customer-email">
          <Input
            id="customer-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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
              <TableHead>WhatsApp</TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead>Desde</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {(customers.data?.data ?? []).length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-muted-foreground">
                  Nenhum cliente ainda.
                </TableCell>
              </TableRow>
            ) : (
              (customers.data?.data ?? []).map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell>{customer.name}</TableCell>
                  <TableCell className="font-mono">{customer.phone}</TableCell>
                  <TableCell>{customer.email ?? "—"}</TableCell>
                  <TableCell>
                    <Timestamp iso={customer.created_at} />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      onClick={async () => {
                        if (!token) return;
                        try {
                          await api.provider.deleteCustomer(token, customer.id);
                          void queryClient.invalidateQueries({
                            queryKey: ["customers"],
                          });
                        } catch (error) {
                          toast.error(
                            error instanceof ApiError && error.status === 409
                              ? "Cliente com orçamento não pode ser excluído."
                              : "Não foi possível excluir o cliente.",
                          );
                        }
                      }}
                    >
                      Excluir
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
