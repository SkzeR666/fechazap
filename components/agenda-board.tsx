"use client";

import Link from "next/link";
import {
  addDays,
  addMonths,
  addWeeks,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  setHours,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { CalendarEvent } from "@/lib/schedule";

export type AgendaRange = "dia" | "semana" | "mes";

const START_HOUR = 7;
const END_HOUR = 21;
const HOUR_PX = 56;
const HOURS = Array.from(
  { length: END_HOUR - START_HOUR },
  (_, index) => START_HOUR + index,
);

function weekStart(date: Date) {
  return startOfWeek(date, { weekStartsOn: 1 });
}

function eventsOnDay(events: CalendarEvent[], day: Date) {
  return events
    .filter((event) => isSameDay(new Date(event.startsAt), day))
    .sort(
      (a, b) =>
        new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
    );
}

function eventLayout(event: CalendarEvent, day: Date) {
  const start = new Date(event.startsAt);
  const end = new Date(event.endsAt);
  const dayStart = setHours(startOfDay(day), START_HOUR);
  const dayEnd = setHours(startOfDay(day), END_HOUR);
  const clampedStart = Math.max(start.getTime(), dayStart.getTime());
  const clampedEnd = Math.min(end.getTime(), dayEnd.getTime());
  const top =
    ((clampedStart - dayStart.getTime()) / (60 * 60 * 1000)) * HOUR_PX;
  const height = Math.max(
    28,
    ((clampedEnd - clampedStart) / (60 * 60 * 1000)) * HOUR_PX,
  );
  return { top, height };
}

export function AgendaBoard({
  range,
  anchor,
  onAnchorChange,
  onPickDay,
  events,
}: {
  range: AgendaRange;
  anchor: Date;
  onAnchorChange: (date: Date) => void;
  onPickDay?: (date: Date) => void;
  events: CalendarEvent[];
}) {
  const label =
    range === "dia"
      ? format(anchor, "EEEE, d 'de' MMMM", { locale: ptBR })
      : range === "semana"
        ? `${format(weekStart(anchor), "d MMM", { locale: ptBR })} – ${format(endOfWeek(anchor, { weekStartsOn: 1 }), "d MMM", { locale: ptBR })}`
        : format(anchor, "MMMM yyyy", { locale: ptBR });

  function shift(direction: -1 | 1) {
    if (range === "dia") onAnchorChange(addDays(anchor, direction));
    else if (range === "semana") onAnchorChange(addWeeks(anchor, direction));
    else onAnchorChange(addMonths(anchor, direction));
  }

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="capitalize font-medium">{label}</p>
        <div className="flex gap-1">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => shift(-1)}
            aria-label="Anterior"
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => onAnchorChange(new Date())}
          >
            Hoje
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => shift(1)}
            aria-label="Próximo"
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>
      {range === "mes" ? (
        <MonthGrid
          anchor={anchor}
          events={events}
          onSelectDay={onPickDay ?? onAnchorChange}
        />
      ) : range === "semana" ? (
        <WeekGrid day={anchor} events={events} />
      ) : (
        <div className="overflow-hidden rounded-xl border bg-card">
          <div className="flex">
            <HourGutter />
            <DayColumn day={anchor} events={eventsOnDay(events, anchor)} />
          </div>
        </div>
      )}
    </div>
  );
}

function HourGutter() {
  return (
    <div className="w-12 shrink-0">
      {HOURS.map((hour) => (
        <div
          key={hour}
          className="font-mono text-[10px] text-muted-foreground"
          style={{ height: HOUR_PX }}
        >
          {String(hour).padStart(2, "0")}:00
        </div>
      ))}
    </div>
  );
}

function DayColumn({
  day,
  events,
  compact,
}: {
  day: Date;
  events: CalendarEvent[];
  compact?: boolean;
}) {
  return (
    <div className="relative min-w-0 flex-1 border-l">
      {HOURS.map((hour) => (
        <div
          key={hour}
          className="border-b border-border/60"
          style={{ height: HOUR_PX }}
        />
      ))}
      {events.map((event) => {
        const { top, height } = eventLayout(event, day);
        const className = cn(
          "absolute inset-x-1 overflow-hidden rounded-md px-1.5 py-1 text-xs shadow-sm",
          event.kind === "block"
            ? "bg-muted text-muted-foreground"
            : event.status === "offered"
              ? "border border-primary/40 bg-primary/10"
              : "bg-primary text-primary-foreground",
        );
        const inner = (
          <>
            <p className="truncate font-medium">
              {event.kind === "block" ? event.title : event.customer}
            </p>
            <p className="truncate opacity-80">
              {format(new Date(event.startsAt), "HH:mm")}
              {!compact && event.kind === "appointment"
                ? ` · ${event.title}`
                : ""}
            </p>
          </>
        );
        if (event.href) {
          return (
            <Link
              key={event.id}
              href={event.href}
              className={className}
              style={{ top, height }}
            >
              {inner}
            </Link>
          );
        }
        return (
          <div key={event.id} className={className} style={{ top, height }}>
            {inner}
          </div>
        );
      })}
    </div>
  );
}

function WeekGrid({ day, events }: { day: Date; events: CalendarEvent[] }) {
  const days = eachDayOfInterval({
    start: weekStart(day),
    end: endOfWeek(day, { weekStartsOn: 1 }),
  });
  return (
    <div className="overflow-x-auto rounded-xl border bg-card">
      <div className="min-w-[840px]">
        <div className="grid grid-cols-[48px_repeat(7,1fr)] border-b">
          <div />
          {days.map((item) => (
            <div key={item.toISOString()} className="px-2 py-2 text-center">
              <p className="font-mono text-[10px] uppercase text-muted-foreground">
                {format(item, "EEE", { locale: ptBR })}
              </p>
              <p
                className={cn(
                  "mx-auto mt-1 flex size-7 items-center justify-center rounded-full text-sm",
                  isSameDay(item, new Date()) &&
                    "bg-primary text-primary-foreground",
                )}
              >
                {format(item, "d")}
              </p>
            </div>
          ))}
        </div>
        <div className="flex">
          <HourGutter />
          {days.map((item) => (
            <DayColumn
              key={item.toISOString()}
              day={item}
              events={eventsOnDay(events, item)}
              compact
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function MonthGrid({
  anchor,
  events,
  onSelectDay,
}: {
  anchor: Date;
  events: CalendarEvent[];
  onSelectDay: (date: Date) => void;
}) {
  const days = eachDayOfInterval({
    start: weekStart(startOfMonth(anchor)),
    end: endOfWeek(endOfMonth(anchor), { weekStartsOn: 1 }),
  });
  const weekdays = eachDayOfInterval({
    start: weekStart(anchor),
    end: endOfWeek(anchor, { weekStartsOn: 1 }),
  });
  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <div className="grid grid-cols-7 border-b">
        {weekdays.map((day) => (
          <p
            key={day.toISOString()}
            className="px-2 py-2 text-center font-mono text-[10px] uppercase text-muted-foreground"
          >
            {format(day, "EEE", { locale: ptBR })}
          </p>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((day) => {
          const dayEvents = eventsOnDay(events, day);
          const extra = Math.max(0, dayEvents.length - 3);
          return (
            <button
              key={day.toISOString()}
              type="button"
              onClick={() => onSelectDay(day)}
              className={cn(
                "min-h-28 border-r border-b p-1.5 text-left align-top last:border-r-0",
                !isSameMonth(day, anchor) && "bg-muted/30 text-muted-foreground",
              )}
            >
              <span
                className={cn(
                  "mb-1 inline-flex size-6 items-center justify-center rounded-full text-xs",
                  isSameDay(day, new Date()) &&
                    "bg-primary text-primary-foreground",
                )}
              >
                {format(day, "d")}
              </span>
              <div className="grid gap-1">
                {dayEvents.slice(0, 3).map((event) => (
                  <span
                    key={event.id}
                    className={cn(
                      "block truncate rounded px-1 py-0.5 text-[11px]",
                      event.kind === "block"
                        ? "bg-muted"
                        : "bg-primary/15 text-foreground",
                    )}
                  >
                    {format(new Date(event.startsAt), "HH:mm")}{" "}
                    {event.kind === "block" ? event.title : event.customer}
                  </span>
                ))}
                {extra > 0 ? (
                  <span className="text-[11px] text-muted-foreground">
                    +{extra}
                  </span>
                ) : null}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
