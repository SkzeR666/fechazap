"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { api } from "@/src/lib/api/client";
import { useAccessToken } from "@/hooks/use-access-token";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { useQuery, useQueryClient } from "@tanstack/react-query";

const WEEKDAYS = [
  "Domingo",
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
];

type DayRule = {
  weekday: number;
  enabled: boolean;
  startTime: string;
  endTime: string;
};

function defaults(): DayRule[] {
  return WEEKDAYS.map((_, weekday) => ({
    weekday,
    enabled: weekday >= 1 && weekday <= 5,
    startTime: "09:00",
    endTime: weekday === 6 ? "13:00" : "18:00",
  }));
}

function toTime(value: string | null, fallback: string) {
  return value ? value.slice(0, 5) : fallback;
}

export default function AppAgendaSettingsPage() {
  const { token, ready } = useAccessToken();
  const queryClient = useQueryClient();
  const [days, setDays] = useState<DayRule[]>(defaults);
  const [saving, setSaving] = useState(false);
  const rules = useQuery({
    queryKey: ["availability-rules", token],
    queryFn: () => api.provider.availabilityRules(token!),
    enabled: ready && Boolean(token),
  });

  useEffect(() => {
    const rows = rules.data?.data ?? [];
    if (rows.length === 0) return;
    setDays(
      defaults().map((day) => {
        const row = rows.find((item) => item.weekday === day.weekday);
        if (!row) return day;
        return {
          weekday: day.weekday,
          enabled: row.enabled,
          startTime: toTime(row.start_time, day.startTime),
          endTime: toTime(row.end_time, day.endTime),
        };
      }),
    );
  }, [rules.data]);

  if (!ready || rules.isLoading) return <Skeleton className="h-80" />;

  async function save() {
    if (!token) return;
    setSaving(true);
    try {
      await api.provider.saveAvailabilityRules(
        token,
        days.map((day) => ({
          weekday: day.weekday,
          startTime: day.enabled ? day.startTime : null,
          endTime: day.enabled ? day.endTime : null,
          enabled: day.enabled,
        })),
      );
      toast.success("Agenda atualizada.");
      void queryClient.invalidateQueries({ queryKey: ["availability-rules"] });
    } catch {
      toast.error("Não foi possível salvar os horários.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid max-w-xl gap-6">
      <Button asChild variant="ghost" className="-ml-2 w-fit">
        <Link href="/app/configuracoes">← Configurações</Link>
      </Button>
      <div>
        <h1 className="text-2xl font-semibold">Agenda</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Horários da semana em que você atende. Bloqueios pontuais ficam na{" "}
          <Link href="/app/agenda" className="underline">
            Agenda
          </Link>
          .
        </p>
      </div>
      <div className="grid gap-3">
        {days.map((day, index) => (
          <Card key={day.weekday} className="grid gap-3 p-4 sm:grid-cols-[7rem_auto_1fr_1fr] sm:items-center">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={day.enabled}
                onChange={(event) => {
                  const next = [...days];
                  const current = next[index];
                  if (!current) return;
                  next[index] = { ...current, enabled: event.target.checked };
                  setDays(next);
                }}
              />
              {WEEKDAYS[day.weekday]}
            </label>
            <span className="hidden text-xs text-muted-foreground sm:block">
              {day.enabled ? "Aberto" : "Fechado"}
            </span>
            <Input
              type="time"
              value={day.startTime}
              disabled={!day.enabled}
              onChange={(event) => {
                const next = [...days];
                const current = next[index];
                if (!current) return;
                next[index] = { ...current, startTime: event.target.value };
                setDays(next);
              }}
            />
            <Input
              type="time"
              value={day.endTime}
              disabled={!day.enabled}
              onChange={(event) => {
                const next = [...days];
                const current = next[index];
                if (!current) return;
                next[index] = { ...current, endTime: event.target.value };
                setDays(next);
              }}
            />
          </Card>
        ))}
      </div>
      <Button
        variant="accent"
        className="h-11 w-fit"
        disabled={saving}
        onClick={() => void save()}
      >
        {saving ? "Salvando..." : "Salvar horários"}
      </Button>
    </div>
  );
}
