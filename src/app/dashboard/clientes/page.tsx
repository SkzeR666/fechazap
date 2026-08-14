"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/src/lib/api/client";
import { useAccessToken } from "@/hooks/use-access-token";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Timestamp } from "@/components/money";
import { Skeleton } from "@/components/ui/skeleton";

export default function CustomersPage() {
  const { token, ready } = useAccessToken();
  const customers = useQuery({
    queryKey: ["customers", token],
    queryFn: () => api.provider.customers(token!),
    enabled: ready && Boolean(token),
  });
  if (!ready || customers.isLoading) return <Skeleton className="h-64" />;
  const rows = customers.data?.data ?? [];
  return (
    <div>
      <h1 className="text-2xl font-semibold">Clientes</h1>
      <div className="mt-6 overflow-x-auto rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>WhatsApp</TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead>Desde</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-muted-foreground">
                  Nenhum cliente ainda.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell>{customer.name}</TableCell>
                  <TableCell className="font-mono">{customer.phone}</TableCell>
                  <TableCell>{customer.email ?? "—"}</TableCell>
                  <TableCell>
                    <Timestamp iso={customer.created_at} />
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
