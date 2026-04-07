"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import frLocale from "@fullcalendar/core/locales/fr";
import {
  CalendarDays,
  CalendarRange,
  ClipboardList,
  Plus,
  X,
} from "lucide-react";
import MobilePlanningView from "./MobilePlanningView";

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

type PlanningContractOption = {
  id: string;
  label: string;
};

type TooltipState = {
  visible: boolean;
  x: number;
  y: number;
  title: string;
  typeLabel: string;
  dateLabel: string;
};

type PlanningFilter = "all" | "contract" | "intervention";
type CalendarView = "dayGridMonth" | "timeGridWeek";

type CreateModalState = {
  open: boolean;
  date: string;
};

const INITIAL_TOOLTIP_STATE: TooltipState = {
  visible: false,
  x: 0,
  y: 0,
  title: "",
  typeLabel: "",
  dateLabel: "",
};

function formatEventDate(date: Date | null) {
  if (!date) return "-";

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function getFilterButtonClass(isActive: boolean) {
  return isActive
    ? "inline-flex items-center rounded-xl bg-[#0b79d0] px-3 py-2 text-sm font-semibold text-white shadow-sm"
    : "inline-flex items-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50";
}

function getViewButtonClass(isActive: boolean) {
  return isActive
    ? "inline-flex items-center rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white"
    : "inline-flex items-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50";
}

export default function PlanningCalendar({
  events,
  contracts,
}: {
  events: PlanningEvent[];
  contracts: PlanningContractOption[];
}) {
  const router = useRouter();

  const [filter, setFilter] = useState<PlanningFilter>("all");
  const [calendarView, setCalendarView] =
    useState<CalendarView>("dayGridMonth");
  const [isMobile, setIsMobile] = useState(false);

  const [tooltip, setTooltip] = useState<TooltipState>(INITIAL_TOOLTIP_STATE);

  const [createModal, setCreateModal] = useState<CreateModalState>({
    open: false,
    date: "",
  });

  const [contractId, setContractId] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createError, setCreateError] = useState("");

  useEffect(() => {
    function handleResize() {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);

      setCalendarView((prev) => {
        if (mobile && prev === "dayGridMonth") return "timeGridWeek";
        if (!mobile && prev === "timeGridWeek") return "dayGridMonth";
        return prev;
      });
    }

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    if (!createModal.open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeCreateModal();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [createModal.open]);

  const filteredEvents = useMemo(() => {
    if (filter === "all") return events;
    return events.filter((event) => event.extendedProps?.type === filter);
  }, [events, filter]);

  const contractsCount = useMemo(() => {
    return events.filter((event) => event.extendedProps?.type === "contract")
      .length;
  }, [events]);

  const interventionsCount = useMemo(() => {
    return events.filter(
      (event) => event.extendedProps?.type === "intervention",
    ).length;
  }, [events]);

  const selectedContract = useMemo(() => {
    return contracts.find((contract) => contract.id === contractId);
  }, [contracts, contractId]);

  const closeTooltip = useCallback(() => {
    setTooltip((prev) => (prev.visible ? { ...prev, visible: false } : prev));
  }, []);

  const openTooltip = useCallback(
    (info: {
      event: {
        title: string;
        start: Date | null;
        extendedProps: {
          type?: "contract" | "intervention";
        };
      };
      jsEvent: MouseEvent;
    }) => {
      if (isMobile) return;

      const type = info.event.extendedProps.type;

      const typeLabel =
        type === "intervention"
          ? "Intervention"
          : type === "contract"
            ? "Contrat"
            : "Événement";

      setTooltip({
        visible: true,
        x: info.jsEvent.clientX + 16,
        y: info.jsEvent.clientY + 16,
        title: info.event.title,
        typeLabel,
        dateLabel: formatEventDate(info.event.start),
      });
    },
    [isMobile],
  );

  const moveTooltip = useCallback(
    (jsEvent: MouseEvent) => {
      if (isMobile) return;

      setTooltip((prev) =>
        prev.visible
          ? {
              ...prev,
              x: jsEvent.clientX + 16,
              y: jsEvent.clientY + 16,
            }
          : prev,
      );
    },
    [isMobile],
  );

  const openCreateModal = useCallback((date: string) => {
    setCreateError("");
    setNotes("");
    setContractId("");
    setCreateModal({
      open: true,
      date,
    });
  }, []);

  function closeCreateModal() {
    setCreateModal({
      open: false,
      date: "",
    });
    setCreateError("");
    setNotes("");
    setContractId("");
    setIsSubmitting(false);
  }

  function handleSelectEvent(event: PlanningEvent) {
    const linkedContractId = event.extendedProps?.contractId;

    if (linkedContractId) {
      router.push(`/dashboard/contracts/${linkedContractId}`);
    }
  }

  async function handleCreateIntervention(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!contractId) {
      setCreateError("Veuillez sélectionner un contrat.");
      return;
    }

    if (!createModal.date) {
      setCreateError("Date invalide.");
      return;
    }

    setIsSubmitting(true);
    setCreateError("");

    try {
      const response = await fetch("/api/interventions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contractId,
          plannedDate: createModal.date,
          notes,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setCreateError(data.message || "Impossible de créer l’intervention.");
        setIsSubmitting(false);
        return;
      }

      closeCreateModal();
      router.refresh();
    } catch {
      setCreateError("Une erreur est survenue lors de la création.");
      setIsSubmitting(false);
    }
  }

  if (isMobile) {
    return (
      <>
        <section className="rounded-[32px] border border-white/70 bg-white/90 p-4 shadow-sm">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setFilter("all")}
              className={getFilterButtonClass(filter === "all")}
            >
              Tous ({events.length})
            </button>

            <button
              type="button"
              onClick={() => setFilter("contract")}
              className={getFilterButtonClass(filter === "contract")}
            >
              Contrats ({contractsCount})
            </button>

            <button
              type="button"
              onClick={() => setFilter("intervention")}
              className={getFilterButtonClass(filter === "intervention")}
            >
              Interventions ({interventionsCount})
            </button>
          </div>
        </section>

        <MobilePlanningView
          events={events}
          filter={filter}
          onSelectEvent={handleSelectEvent}
          onCreateAtDate={openCreateModal}
        />

        {createModal.open && (
          <div className="fixed inset-0 z-[9998] flex items-end justify-center bg-slate-900/50 p-0">
            <div className="w-full rounded-t-[28px] bg-white p-5 shadow-2xl ring-1 ring-slate-200">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-[#0b79d0]">
                    Nouvelle intervention
                  </p>
                  <h2 className="text-2xl font-bold text-slate-900">
                    Créer depuis le planning
                  </h2>
                  <p className="mt-2 text-sm text-slate-500">
                    Date sélectionnée :{" "}
                    <span className="font-semibold text-slate-700">
                      {createModal.date
                        ? new Date(createModal.date).toLocaleDateString("fr-FR")
                        : "-"}
                    </span>
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeCreateModal}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-700 transition hover:bg-slate-50"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleCreateIntervention} className="grid gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Contrat
                  </label>
                  <select
                    value={contractId}
                    onChange={(e) => setContractId(e.target.value)}
                    required
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-[#0b79d0] focus:ring-4 focus:ring-[#0b79d0]/10"
                  >
                    <option value="">Choisir un contrat</option>
                    {contracts.map((contract) => (
                      <option key={contract.id} value={contract.id}>
                        {contract.label}
                      </option>
                    ))}
                  </select>

                  {selectedContract ? (
                    <p className="mt-2 text-xs text-slate-500">
                      Intervention pour :
                      <span className="ml-1 font-semibold text-slate-700">
                        {selectedContract.label}
                      </span>
                    </p>
                  ) : null}
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Date prévue
                  </label>
                  <input
                    type="date"
                    value={createModal.date}
                    onChange={(e) =>
                      setCreateModal((prev) => ({
                        ...prev,
                        date: e.target.value,
                      }))
                    }
                    required
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-[#0b79d0] focus:ring-4 focus:ring-[#0b79d0]/10"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Notes
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={4}
                    placeholder="Ajouter une note si besoin"
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-[#0b79d0] focus:ring-4 focus:ring-[#0b79d0]/10"
                  />
                </div>

                {createError ? (
                  <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
                    {createError}
                  </div>
                ) : null}

                <div className="flex flex-col gap-3">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex items-center justify-center rounded-2xl bg-[#0b79d0] px-5 py-3 font-semibold text-white shadow-md transition hover:-translate-y-0.5 hover:bg-[#0a6dbd] hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    {isSubmitting ? "Création..." : "Programmer l’intervention"}
                  </button>

                  <button
                    type="button"
                    onClick={closeCreateModal}
                    disabled={isSubmitting}
                    className="inline-flex items-center justify-center rounded-2xl border border-slate-200 px-5 py-3 font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    <ClipboardList className="mr-2 h-4 w-4" />
                    Annuler
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <>
      <section className="overflow-hidden rounded-[32px] border border-white/70 bg-white/90 shadow-sm">
        <div className="border-b border-slate-100 px-4 py-4 sm:px-6 sm:py-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="text-sm font-semibold text-[#0b79d0]">
                Calendrier terrain
              </p>
              <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
                Planning des maintenances
              </h2>
            </div>

            <div className="flex flex-col gap-3 xl:items-end">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setFilter("all")}
                  className={getFilterButtonClass(filter === "all")}
                >
                  Tous ({events.length})
                </button>

                <button
                  type="button"
                  onClick={() => setFilter("contract")}
                  className={getFilterButtonClass(filter === "contract")}
                >
                  Contrats ({contractsCount})
                </button>

                <button
                  type="button"
                  onClick={() => setFilter("intervention")}
                  className={getFilterButtonClass(filter === "intervention")}
                >
                  Interventions ({interventionsCount})
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setCalendarView("dayGridMonth")}
                  className={getViewButtonClass(
                    calendarView === "dayGridMonth",
                  )}
                >
                  <CalendarDays className="mr-2 h-4 w-4" />
                  Mois
                </button>

                <button
                  type="button"
                  onClick={() => setCalendarView("timeGridWeek")}
                  className={getViewButtonClass(
                    calendarView === "timeGridWeek",
                  )}
                >
                  <CalendarRange className="mr-2 h-4 w-4" />
                  Semaine
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="px-3 py-3 sm:px-4 sm:py-4">
          <div className="rounded-[28px] border border-slate-200 bg-white p-2 sm:p-4">
            <div className="planning-calendar overflow-hidden rounded-[22px]">
              <FullCalendar
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                locales={[frLocale]}
                locale="fr"
                initialView={calendarView}
                height="auto"
                aspectRatio={1.6}
                buttonText={{
                  today: "Aujourd’hui",
                  month: "Mois",
                  week: "Semaine",
                }}
                events={filteredEvents}
                headerToolbar={{
                  left: "prev,next today",
                  center: "title",
                  right: "",
                }}
                dayMaxEvents={3}
                moreLinkText={(n) => `+${n}`}
                dateClick={(info) => {
                  closeTooltip();
                  openCreateModal(info.dateStr);
                }}
                eventClick={(info) => {
                  const linkedContractId = info.event.extendedProps.contractId;

                  if (linkedContractId) {
                    router.push(`/dashboard/contracts/${linkedContractId}`);
                  }
                }}
                eventMouseEnter={(info) => {
                  openTooltip({
                    event: {
                      title: info.event.title,
                      start: info.event.start,
                      extendedProps: {
                        type: info.event.extendedProps.type,
                      },
                    },
                    jsEvent: info.jsEvent as MouseEvent,
                  });
                }}
                eventMouseLeave={closeTooltip}
                eventDidMount={(info) => {
                  const handleMouseMove = (event: MouseEvent) => {
                    moveTooltip(event);
                  };

                  info.el.addEventListener("mousemove", handleMouseMove);

                  const type = info.event.extendedProps.type;

                  if (type === "contract") {
                    info.el.style.background =
                      "linear-gradient(135deg, #0b79d0 0%, #1d8ae0 100%)";
                    info.el.style.color = "#ffffff";
                  }

                  if (type === "intervention") {
                    info.el.style.background =
                      "linear-gradient(135deg, #ef4444 0%, #f87171 100%)";
                    info.el.style.color = "#ffffff";
                  }

                  return () => {
                    info.el.removeEventListener("mousemove", handleMouseMove);
                  };
                }}
                eventClassNames="cursor-pointer"
                key={calendarView}
              />
            </div>
          </div>
        </div>
      </section>

      {tooltip.visible && (
        <div
          className="pointer-events-none fixed z-[9999] hidden w-72 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl lg:block"
          style={{
            left: tooltip.x,
            top: tooltip.y,
          }}
        >
          <div className="mb-2 flex items-center justify-between gap-3">
            <span className="rounded-full bg-[#0b79d0]/10 px-2.5 py-1 text-xs font-semibold text-[#0b79d0]">
              {tooltip.typeLabel}
            </span>
          </div>

          <p className="text-sm font-semibold text-slate-900">
            {tooltip.title}
          </p>

          <p className="mt-2 text-sm text-slate-500">
            Date :{" "}
            <span className="font-medium text-slate-700">
              {tooltip.dateLabel}
            </span>
          </p>
        </div>
      )}

      {createModal.open && (
        <div className="fixed inset-0 z-[9998] flex items-end justify-center bg-slate-900/50 p-0 sm:items-center sm:p-4">
          <div className="w-full rounded-t-[28px] bg-white p-5 shadow-2xl ring-1 ring-slate-200 sm:max-w-xl sm:rounded-[28px] sm:p-6">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-[#0b79d0]">
                  Nouvelle intervention
                </p>
                <h2 className="text-2xl font-bold text-slate-900">
                  Créer depuis le planning
                </h2>
                <p className="mt-2 text-sm text-slate-500">
                  Date sélectionnée :{" "}
                  <span className="font-semibold text-slate-700">
                    {createModal.date
                      ? new Date(createModal.date).toLocaleDateString("fr-FR")
                      : "-"}
                  </span>
                </p>
              </div>

              <button
                type="button"
                onClick={closeCreateModal}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-700 transition hover:bg-slate-50"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateIntervention} className="grid gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Contrat
                </label>
                <select
                  value={contractId}
                  onChange={(e) => setContractId(e.target.value)}
                  required
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-[#0b79d0] focus:ring-4 focus:ring-[#0b79d0]/10"
                >
                  <option value="">Choisir un contrat</option>
                  {contracts.map((contract) => (
                    <option key={contract.id} value={contract.id}>
                      {contract.label}
                    </option>
                  ))}
                </select>

                {selectedContract ? (
                  <p className="mt-2 text-xs text-slate-500">
                    Intervention pour :
                    <span className="ml-1 font-semibold text-slate-700">
                      {selectedContract.label}
                    </span>
                  </p>
                ) : null}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Date prévue
                </label>
                <input
                  type="date"
                  value={createModal.date}
                  onChange={(e) =>
                    setCreateModal((prev) => ({
                      ...prev,
                      date: e.target.value,
                    }))
                  }
                  required
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-[#0b79d0] focus:ring-4 focus:ring-[#0b79d0]/10"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                  placeholder="Ajouter une note si besoin"
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-[#0b79d0] focus:ring-4 focus:ring-[#0b79d0]/10"
                />
              </div>

              {createError ? (
                <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
                  {createError}
                </div>
              ) : null}

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center justify-center rounded-2xl bg-[#0b79d0] px-5 py-3 font-semibold text-white shadow-md transition hover:-translate-y-0.5 hover:bg-[#0a6dbd] hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-70"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  {isSubmitting ? "Création..." : "Programmer l’intervention"}
                </button>

                <button
                  type="button"
                  onClick={closeCreateModal}
                  disabled={isSubmitting}
                  className="inline-flex items-center justify-center rounded-2xl border border-slate-200 px-5 py-3 font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  <ClipboardList className="mr-2 h-4 w-4" />
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx global>{`
        .planning-calendar .fc {
          font-family: inherit;
          --fc-border-color: #e2e8f0;
          --fc-page-bg-color: #ffffff;
          --fc-neutral-bg-color: #f8fafc;
          --fc-today-bg-color: rgba(11, 121, 208, 0.06);
        }

        .planning-calendar .fc-toolbar {
          gap: 0.75rem;
          margin-bottom: 1rem !important;
          flex-wrap: wrap;
        }

        .planning-calendar .fc-toolbar-title {
          font-size: 1.1rem !important;
          font-weight: 700;
          color: #0f172a;
          letter-spacing: -0.02em;
        }

        .planning-calendar .fc-button {
          border-radius: 0.85rem !important;
          border: 1px solid #e2e8f0 !important;
          background: #ffffff !important;
          color: #334155 !important;
          box-shadow: none !important;
          padding: 0.55rem 0.9rem !important;
          font-size: 0.875rem !important;
          font-weight: 600 !important;
          transition:
            background 0.2s ease,
            border-color 0.2s ease,
            color 0.2s ease,
            transform 0.2s ease;
        }

        .planning-calendar .fc-button:hover {
          background: #f8fafc !important;
          border-color: #cbd5e1 !important;
        }

        .planning-calendar .fc-button:focus {
          box-shadow: 0 0 0 4px rgba(11, 121, 208, 0.08) !important;
        }

        .planning-calendar .fc-button-primary:not(:disabled).fc-button-active {
          background: #0b79d0 !important;
          color: white !important;
          border-color: #0b79d0 !important;
        }

        .planning-calendar .fc-theme-standard td,
        .planning-calendar .fc-theme-standard th,
        .planning-calendar .fc-theme-standard .fc-scrollgrid {
          border-color: #e2e8f0 !important;
        }

        .planning-calendar .fc-scrollgrid {
          border-radius: 1rem;
          overflow: hidden;
        }

        .planning-calendar .fc-col-header-cell {
          background: #f8fafc;
          padding: 0.65rem 0;
        }

        .planning-calendar .fc-col-header-cell-cushion {
          color: #334155;
          font-weight: 700;
          text-decoration: none !important;
          font-size: 0.82rem;
        }

        .planning-calendar .fc-daygrid-day-number,
        .planning-calendar .fc-timegrid-axis-cushion,
        .planning-calendar .fc-timegrid-slot-label-cushion {
          color: #334155;
          text-decoration: none !important;
          font-weight: 600;
        }

        .planning-calendar .fc-daygrid-day-number {
          font-size: 0.85rem;
          padding: 0.45rem 0.55rem !important;
        }

        .planning-calendar .fc-daygrid-day-frame {
          min-height: 120px;
          background: #ffffff;
          transition: background 0.2s ease;
        }

        .planning-calendar .fc-daygrid-day:hover .fc-daygrid-day-frame {
          background: #fbfdff;
        }

        .planning-calendar .fc-day-today {
          background: rgba(11, 121, 208, 0.06) !important;
        }

        .planning-calendar .fc-day-today .fc-daygrid-day-number {
          color: #0b79d0 !important;
          font-weight: 800;
        }

        .planning-calendar .fc-event {
          border: none !important;
          border-radius: 0.8rem !important;
          padding: 0.2rem 0.45rem !important;
          font-size: 0.74rem !important;
          font-weight: 600 !important;
          line-height: 1.25 !important;
          box-shadow: 0 1px 2px rgba(15, 23, 42, 0.08);
          overflow: hidden;
        }

        .planning-calendar .fc-event-main {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .planning-calendar .fc-daygrid-event {
          margin-top: 2px !important;
          margin-left: 2px !important;
          margin-right: 2px !important;
        }

        .planning-calendar .fc-daygrid-more-link {
          color: #0b79d0 !important;
          font-size: 0.72rem;
          font-weight: 700;
          padding: 0.15rem 0.35rem;
        }

        .planning-calendar .fc-popover {
          border-radius: 1rem !important;
          border: 1px solid #e2e8f0 !important;
          box-shadow: 0 16px 40px rgba(15, 23, 42, 0.14) !important;
          overflow: hidden;
        }

        .planning-calendar .fc-popover-header {
          background: #f8fafc !important;
          padding: 0.75rem 1rem !important;
          font-weight: 700;
          color: #0f172a;
        }

        .planning-calendar .fc-timegrid-slot {
          height: 3rem !important;
        }

        .planning-calendar .fc-timegrid-axis,
        .planning-calendar .fc-timegrid-slot-label {
          color: #64748b;
          font-size: 0.75rem;
        }

        .planning-calendar .fc-timegrid-now-indicator-line {
          border-color: #0b79d0 !important;
        }

        .planning-calendar .fc-timegrid-now-indicator-arrow {
          border-color: #0b79d0 !important;
        }

        .planning-calendar .fc-timegrid-event {
          border-radius: 0.9rem !important;
          padding: 0.2rem 0.4rem !important;
        }

        .planning-calendar .fc-timegrid-event .fc-event-main {
          white-space: normal;
          overflow: hidden;
        }
      `}</style>
    </>
  );
}
