import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import BackButton from "@/components/ui/BackButton";
import {
  CalendarDays,
  Clock3,
  ClipboardCheck,
  FileText,
  User,
  Wrench,
} from "lucide-react";

function formatDate(date: Date | string | null) {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("fr-FR");
}

function getStatusConfig(status: string) {
  switch (status) {
    case "DONE":
      return {
        label: "Faite",
        className:
          "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200",
      };
    case "PLANNED":
      return {
        label: "Planifiée",
        className:
          "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200",
      };
    case "CANCELLED":
      return {
        label: "Annulée",
        className: "bg-red-50 text-red-700 ring-1 ring-inset ring-red-200",
      };
    default:
      return {
        label: status,
        className:
          "bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-200",
      };
  }
}

const checklistItems = [
  "Nettoyage filtres",
  "Vérification pression",
  "Contrôle unité intérieure",
  "Contrôle unité extérieure",
];

export default async function EditInterventionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const intervention = await prisma.intervention.findUnique({
    where: { id },
    include: {
      contract: {
        include: {
          client: true,
        },
      },
    },
  });

  if (!intervention) {
    redirect("/dashboard");
  }

  const status = getStatusConfig(intervention.status);
  const plannedDateValue = intervention.plannedDate
    ? new Date(intervention.plannedDate).toISOString().split("T")[0]
    : "";

  const plannedTimeValue = intervention.plannedDate
    ? new Date(intervention.plannedDate).toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      })
    : "";

  const currentNotes = intervention.notes || "";
  const checkedItems = checklistItems.filter((item) =>
    currentNotes.toLowerCase().includes(item.toLowerCase()),
  );

  return (
    <main className="space-y-6">
      {/* HEADER */}
      <section className="rounded-[32px] border border-white/70 bg-white/90 p-6 shadow-sm">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-4">
            <BackButton
              fallbackHref={`/dashboard/contracts/${intervention.contractId}`}
            />

            <div>
              <div className="inline-flex items-center rounded-full bg-[#0b79d0]/8 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#0b79d0]">
                Intervention
              </div>

              <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                Modifier intervention
              </h1>

              <div className="mt-3 flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center rounded-full bg-slate-50 px-3 py-1.5 text-sm font-medium text-slate-600">
                  Client : {intervention.contract.client.firstName}{" "}
                  {intervention.contract.client.lastName}
                </span>

                <span className="inline-flex items-center rounded-full bg-slate-50 px-3 py-1.5 text-sm font-medium text-slate-600">
                  Équipement : {intervention.contract.equipmentType}
                </span>

                <span
                  className={`inline-flex items-center rounded-full px-3 py-1.5 text-sm font-semibold ${status.className}`}
                >
                  {status.label}
                </span>
              </div>

              <p className="mt-4 max-w-2xl text-sm text-slate-500">
                Modifiez la planification, le contrôle technique et le
                compte-rendu de cette intervention.
              </p>
            </div>
          </div>

          <Link
            href={`/dashboard/contracts/${intervention.contractId}`}
            className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Retour au contrat
          </Link>
        </div>
      </section>

      {/* KPI */}
      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Client"
          value={`${intervention.contract.client.firstName} ${intervention.contract.client.lastName}`}
          icon={<User className="h-5 w-5 text-slate-400" />}
          color="bg-[#0b79d0]"
        />

        <StatCard
          label="Équipement"
          value={intervention.contract.equipmentType}
          icon={<Wrench className="h-5 w-5 text-slate-400" />}
          color="bg-cyan-500"
        />

        <StatCard
          label="Date prévue"
          value={formatDate(intervention.plannedDate)}
          icon={<CalendarDays className="h-5 w-5 text-slate-400" />}
          color="bg-amber-500"
        />

        <StatCard
          label="Statut"
          value={status.label}
          icon={<Clock3 className="h-5 w-5 text-slate-400" />}
          color="bg-emerald-500"
        />
      </section>

      {/* FORM */}
      <form
        action={`/api/interventions/${id}/update`}
        method="POST"
        className="grid gap-6 xl:grid-cols-3"
      >
        {/* COLONNE GAUCHE */}
        <div className="space-y-6 xl:col-span-2">
          {/* PLANIFICATION */}
          <section className="rounded-[32px] border border-white/70 bg-white/90 p-6 shadow-sm">
            <div className="mb-6">
              <p className="text-sm font-semibold text-[#0b79d0]">
                Planification
              </p>
              <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
                Date, heure et statut
              </h2>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Date prévue
                </label>
                <input
                  type="date"
                  name="plannedDate"
                  defaultValue={plannedDateValue}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-[#0b79d0] focus:ring-4 focus:ring-[#0b79d0]/10"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Heure
                </label>
                <input
                  type="time"
                  name="time"
                  defaultValue={plannedTimeValue}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-[#0b79d0] focus:ring-4 focus:ring-[#0b79d0]/10"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Statut
                </label>
                <select
                  name="status"
                  defaultValue={intervention.status}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-[#0b79d0] focus:ring-4 focus:ring-[#0b79d0]/10"
                >
                  <option value="PLANNED">Planifiée</option>
                  <option value="DONE">Faite</option>
                  <option value="CANCELLED">Annulée</option>
                </select>
              </div>
            </div>
          </section>

          {/* CHECKLIST */}
          <section className="rounded-[32px] border border-white/70 bg-white/90 p-6 shadow-sm">
            <div className="mb-6">
              <p className="text-sm font-semibold text-[#0b79d0]">
                Contrôle technique
              </p>
              <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
                Checklist intervention
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Coche les points contrôlés pendant l’intervention.
              </p>
            </div>

            <div className="grid gap-3">
              {checklistItems.map((item) => (
                <label
                  key={item}
                  className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-4 transition hover:bg-white"
                >
                  <input
                    type="checkbox"
                    name="checklist"
                    value={item}
                    defaultChecked={checkedItems.includes(item)}
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-[#0b79d0] focus:ring-[#0b79d0]"
                  />
                  <div>
                    <p className="font-medium text-slate-900">{item}</p>
                  </div>
                </label>
              ))}
            </div>
          </section>

          {/* COMPTE-RENDU */}
          <section className="rounded-[32px] border border-white/70 bg-white/90 p-6 shadow-sm">
            <div className="mb-6">
              <p className="text-sm font-semibold text-[#0b79d0]">
                Compte-rendu
              </p>
              <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
                Notes et validation
              </h2>
            </div>

            <div className="grid gap-5">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Notes
                </label>
                <textarea
                  name="notes"
                  defaultValue={currentNotes}
                  rows={6}
                  placeholder="Décris les actions réalisées, les anomalies constatées ou les recommandations."
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-[#0b79d0] focus:ring-4 focus:ring-[#0b79d0]/10"
                />
                <p className="mt-2 text-xs text-slate-500">
                  Exemple : nettoyage effectué, contrôle pression OK, remarque à
                  signaler au client…
                </p>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Nom du client (validation)
                </label>
                <input
                  type="text"
                  name="clientName"
                  placeholder="Ex : Dupont"
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-[#0b79d0] focus:ring-4 focus:ring-[#0b79d0]/10"
                />
              </div>
            </div>
          </section>
        </div>

        {/* COLONNE DROITE */}
        <div className="space-y-6">
          <section className="rounded-[32px] border border-white/70 bg-white/90 p-6 shadow-sm">
            <div className="mb-6">
              <p className="text-sm font-semibold text-[#0b79d0]">Vue rapide</p>
              <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
                Résumé
              </h2>
            </div>

            <div className="space-y-4">
              <QuickInfo
                label="Client"
                value={`${intervention.contract.client.firstName} ${intervention.contract.client.lastName}`}
              />
              <QuickInfo
                label="Équipement"
                value={intervention.contract.equipmentType}
              />
              <QuickInfo
                label="Date actuelle"
                value={formatDate(intervention.plannedDate)}
              />
              <QuickInfo label="Statut" value={status.label} />
            </div>
          </section>

          <section className="rounded-[32px] border border-white/70 bg-white/90 p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5 text-slate-400" />
              <h3 className="text-lg font-bold text-slate-900">Actions</h3>
            </div>

            <div className="space-y-3">
              <button
                type="submit"
                className="w-full rounded-2xl bg-[#0b79d0] px-5 py-3 font-semibold text-white shadow-md transition hover:-translate-y-0.5 hover:bg-[#0a6dbd] hover:shadow-lg"
              >
                Enregistrer les modifications
              </button>

              <Link
                href={`/dashboard/contracts/${intervention.contractId}`}
                className="inline-flex w-full items-center justify-center rounded-2xl border border-slate-200 px-5 py-3 font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Annuler
              </Link>
            </div>
          </section>

          <section className="rounded-[32px] border border-white/70 bg-white/90 p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5 text-slate-400" />
              <h3 className="text-lg font-bold text-slate-900">Conseil UX</h3>
            </div>

            <p className="text-sm leading-6 text-slate-500">
              Utilise la checklist pour les actions standard, puis complète les
              notes uniquement pour les anomalies, remarques ou recommandations.
            </p>
          </section>
        </div>
      </form>
    </main>
  );
}

function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <div className="rounded-[30px] border border-white/70 bg-white/90 p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        {icon}
      </div>
      <p className="mt-4 text-base font-semibold text-slate-900">{value}</p>
      <div className={`mt-5 h-1.5 w-16 rounded-full ${color}`} />
    </div>
  );
}

function QuickInfo({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50/80 px-4 py-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 font-semibold text-slate-900">{value}</p>
    </div>
  );
}
