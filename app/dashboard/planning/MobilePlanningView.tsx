"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";

type PlanningEvent = {
  id: string;
  title: string;
  date: Date | string;
  color?: string;
  extendedProps?: {
    contractId?: string;
    interventionId?: string;
    type?: "contract" | "intervention";
  };
};

type PlanningFilter = "all" | "contract" | "intervention";

type MobilePlanningViewProps = {
  events: PlanningEvent[];
  filter: PlanningFilter;
  onSelectEvent: (event: PlanningEvent) => void;
  onCreateAtDate: (date: string) => void;
};

const DAY_LABELS = ["L", "M", "M", "J", "V", "S", "D"];
const MONTH_LABELS = [
  "Janvier",
  "Février",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Août",
  "Septembre",
  "Octobre",
  "Novembre",
  "Décembre",
];

function toDateOnlyString(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function normalizeDate(input: Date | string) {
  const date = new Date(input);
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

function startOfCalendarGrid(date: Date) {
  const first = startOfMonth(date);
  const day = first.getDay();
  const mondayBasedOffset = day === 0 ? 6 : day - 1;
  const result = new Date(first);
  result.setDate(first.getDate() - mondayBasedOffset);
  return result;
}

function endOfCalendarGrid(date: Date) {
  const last = endOfMonth(date);
  const day = last.getDay();
  const mondayBasedOffset = day === 0 ? 0 : 7 - day;
  const result = new Date(last);
  result.setDate(last.getDate() + mondayBasedOffset);
  return result;
}

function formatLongDate(date: Date) {
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(date);
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function getEventTypeLabel(type?: "contract" | "intervention") {
  if (type === "intervention") return "Intervention";
  if (type === "contract") return "Contrat";
  return "Événement";
}

function getEventStyle(type?: "contract" | "intervention") {
  if (type === "intervention") {
    return {
      dot: "bg-red-500",
      pill: "bg-red-50 text-red-700 ring-1 ring-inset ring-red-200",
      border: "border-red-100",
      accent: "bg-red-500",
    };
  }

  return {
    dot: "bg-[#0b79d0]",
    pill: "bg-[#0b79d0]/10 text-[#0b79d0] ring-1 ring-inset ring-[#0b79d0]/15",
    border: "border-[#0b79d0]/10",
    accent: "bg-[#0b79d0]",
  };
}

export default function MobilePlanningView({
  events,
  filter,
  onSelectEvent,
  onCreateAtDate,
}: MobilePlanningViewProps) {
  const today = useMemo(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }, []);

  const [currentMonth, setCurrentMonth] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1),
  );
  const [selectedDate, setSelectedDate] = useState(today);

  const filteredEvents = useMemo(() => {
    if (filter === "all") return events;
    return events.filter((event) => event.extendedProps?.type === filter);
  }, [events, filter]);

  const monthTitle = `${MONTH_LABELS[currentMonth.getMonth()]} ${currentMonth.getFullYear()}`;

  const calendarDays = useMemo(() => {
    const start = startOfCalendarGrid(currentMonth);
    const end = endOfCalendarGrid(currentMonth);

    const days: Date[] = [];
    const cursor = new Date(start);

    while (cursor <= end) {
      days.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }

    return days;
  }, [currentMonth]);

  const eventsByDate = useMemo(() => {
    const map = new Map<string, PlanningEvent[]>();

    for (const event of filteredEvents) {
      const key = toDateOnlyString(normalizeDate(event.date));
      const current = map.get(key) || [];
      current.push(event);
      map.set(key, current);
    }

    return map;
  }, [filteredEvents]);

  const selectedDateKey = toDateOnlyString(selectedDate);
  const selectedDayEvents = eventsByDate.get(selectedDateKey) || [];

  return (
    <div className="space-y-4">
      <section className="sticky top-0 z-10 rounded-[32px] border border-white/70 bg-white/95 p-4 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-white/80">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() =>
              setCurrentMonth(
                new Date(
                  currentMonth.getFullYear(),
                  currentMonth.getMonth() - 1,
                  1,
                ),
              )
            }
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#0b79d0]">
              Planning mobile
            </p>
            <h2 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
              {monthTitle}
            </h2>
          </div>

          <button
            type="button"
            onClick={() =>
              setCurrentMonth(
                new Date(
                  currentMonth.getFullYear(),
                  currentMonth.getMonth() + 1,
                  1,
                ),
              )
            }
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => {
              setCurrentMonth(
                new Date(today.getFullYear(), today.getMonth(), 1),
              );
              setSelectedDate(today);
            }}
            className="rounded-full bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white"
          >
            Aujourd’hui
          </button>

          <button
            type="button"
            onClick={() => onCreateAtDate(selectedDateKey)}
            className="inline-flex items-center rounded-full bg-[#0b79d0] px-4 py-2.5 text-sm font-semibold text-white shadow-sm"
          >
            <Plus className="mr-1.5 h-4 w-4" />
            Ajouter
          </button>
        </div>
      </section>

      <section className="rounded-[32px] border border-white/70 bg-white/90 p-4 shadow-sm">
        <div className="grid grid-cols-7 gap-2 text-center">
          {DAY_LABELS.map((label, index) => (
            <div
              key={`${label}-${index}`}
              className="text-xs font-semibold uppercase tracking-wide text-slate-400"
            >
              {label}
            </div>
          ))}
        </div>

        <div className="mt-3 grid grid-cols-7 gap-y-3">
          {calendarDays.map((day) => {
            const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
            const isToday = isSameDay(day, today);
            const isSelected = isSameDay(day, selectedDate);
            const dayKey = toDateOnlyString(day);
            const dayEvents = eventsByDate.get(dayKey) || [];

            return (
              <button
                key={dayKey}
                type="button"
                onClick={() => setSelectedDate(day)}
                className={`flex min-h-[66px] flex-col items-center justify-start rounded-2xl px-1 py-1.5 transition ${
                  isSelected ? "bg-slate-100" : "bg-transparent"
                } ${!isCurrentMonth ? "opacity-35" : ""}`}
              >
                <span
                  className={`inline-flex h-9 w-9 items-center justify-center rounded-full text-base font-bold ${
                    isSelected
                      ? "bg-[#0b79d0] text-white shadow-sm"
                      : isToday
                        ? "bg-slate-900 text-white"
                        : "text-slate-900"
                  }`}
                >
                  {day.getDate()}
                </span>

                <div className="mt-2 flex h-3 items-center justify-center gap-1">
                  {dayEvents.slice(0, 3).map((event) => {
                    const style = getEventStyle(event.extendedProps?.type);
                    return (
                      <span
                        key={event.id}
                        className={`h-1.5 w-1.5 rounded-full ${style.dot}`}
                      />
                    );
                  })}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <section className="rounded-[32px] border border-white/70 bg-white/90 shadow-sm">
        <div className="border-b border-slate-100 px-4 py-4">
          <p className="text-sm font-semibold text-[#0b79d0]">Agenda du jour</p>
          <h3 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
            {capitalize(formatLongDate(selectedDate))}
          </h3>
        </div>

        <div className="p-4">
          {selectedDayEvents.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center">
              <p className="text-sm font-medium text-slate-900">
                Aucun événement prévu
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Ajoute une intervention pour cette date.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {selectedDayEvents.map((event) => {
                const style = getEventStyle(event.extendedProps?.type);

                return (
                  <button
                    key={event.id}
                    type="button"
                    onClick={() => onSelectEvent(event)}
                    className={`flex w-full items-start gap-3 rounded-[28px] border bg-white px-4 py-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${style.border}`}
                  >
                    <div
                      className={`mt-1 h-11 w-1.5 rounded-full ${style.accent}`}
                    />

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${style.pill}`}
                        >
                          {getEventTypeLabel(event.extendedProps?.type)}
                        </span>
                      </div>

                      <p className="mt-2 text-[15px] font-semibold leading-5 text-slate-900">
                        {event.title}
                      </p>

                      <p className="mt-1 text-sm text-slate-500">
                        Ouvrir le contrat associé
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
