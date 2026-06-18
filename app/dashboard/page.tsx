import type { ReactNode } from "react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getDaysUntilMaintenance } from "@/lib/contracts";
import RunRemindersButton from "@/components/reminders/RunRemindersButton";
import {
  AlertTriangle,
  ArrowRight,
  Bot,
  CalendarClock,
  FileText,
  FolderKanban,
  MailCheck,
  ShieldCheck,
} from "lucide-react";

function getPriorityLabel(days: number) {
  if (days < 0) return `${Math.abs(days)}j de retard`;
  if (days === 0) return "Aujourd’hui";
  if (days <= 30) return `Dans ${days}j`;
  return "Planifié";
}

function getPriorityClass(days: number) {
  if (days < 0) {
    return "bg-red-50 text-red-600 ring-1 ring-inset ring-red-200";
  }

  if (days <= 30) {
    return "bg-amber-50 text-amber-600 ring-1 ring-inset ring-amber-200";
  }

  return "bg-emerald-50 text-emerald-600 ring-1 ring-inset ring-emerald-200";
}

function formatDate(date: Date | string | null) {
  if (!date) return "-";

  return new Date(date).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "Europe/Paris",
  });
}

function formatDateTime(date: Date | string | null) {
  if (!date) return "Aucune exécution enregistrée";

  return new Date(date).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Paris",
  });
}

function getNextCronDate() {
  const now = new Date();
  const next = new Date(now);

  next.setUTCHours(6, 0, 0, 0);

  if (now >= next) {
    next.setUTCDate(next.getUTCDate() + 1);
  }

  return next;
}

function getStartOfTodayParis() {
  const now = new Date();
  const parisDate = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Paris",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);

  return new Date(`${parisDate}T00:00:00+02:00`);
}

function getEndOfTodayParis() {
  const now = new Date();
  const parisDate = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Paris",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);

  return new Date(`${parisDate}T23:59:59+02:00`);
}

export default async function DashboardPage() {
  const user = await getCurrentUser();
  const todayStart = getStartOfTodayParis();
  const todayEnd = getEndOfTodayParis();

  const [clientsCount, activeContracts, todayInterventions, lastAutomationRun] =
    await Promise.all([
      prisma.client.count(),
      prisma.contract.findMany({
        where: { status: "ACTIVE" },
        include: {
          client: true,
          interventions: {
            orderBy: { plannedDate: "asc" },
          },
        },
        orderBy: { nextMaintenanceDate: "asc" },
      }),
      prisma.intervention.findMany({
        where: {
          status: "PLANNED",
          plannedDate: {
            gte: todayStart,
            lte: todayEnd,
          },
        },
        include: {
          contract: {
            include: { client: true },
          },
        },
        orderBy: { plannedDate: "asc" },
        take: 6,
      }),
      prisma.automationRun.findFirst({
        where: { type: "AUTO_J30" },
        orderBy: { createdAt: "desc" },
      }),
    ]);

  const contractsCount = activeContracts.length;

  const overdueCount = activeContracts.filter(
    (contract) => getDaysUntilMaintenance(contract.nextMaintenanceDate) < 0,
  ).length;

  const upcomingCount = activeContracts.filter((contract) => {
    const days = getDaysUntilMaintenance(contract.nextMaintenanceDate);
    return days >= 0 && days <= 30;
  }).length;

  const maintenancesToPlanCount = activeContracts.filter((contract) => {
    const days = getDaysUntilMaintenance(contract.nextMaintenanceDate);
    const hasFuturePlannedIntervention = contract.interventions.some(
      (intervention) =>
        intervention.status === "PLANNED" &&
        intervention.plannedDate &&
        intervention.plannedDate >= todayStart,
    );

    return days <= 30 && !hasFuturePlannedIntervention;
  }).length;

  const confirmationsToSend = activeContracts.reduce((count, contract) => {
    return (
      count +
      contract.interventions.filter(
        (intervention) =>
          intervention.status === "PLANNED" &&
          intervention.plannedDate &&
          !intervention.confirmationSentAt,
      ).length
    );
  }, 0);

  const lateInterventionsCount = activeContracts.reduce((count, contract) => {
    return (
      count +
      contract.interventions.filter(
        (intervention) =>
          intervention.status === "PLANNED" &&
          intervention.plannedDate &&
          intervention.plannedDate < todayStart,
      ).length
    );
  }, 0);

  const nextContracts = activeContracts.slice(0, 6);

  const urgentContracts = activeContracts
    .filter(
      (contract) => getDaysUntilMaintenance(contract.nextMaintenanceDate) <= 30,
    )
    .slice(0, 3);

  const automationIsHealthy =
    !lastAutomationRun || lastAutomationRun.status !== "FAILED";

  return (
    <main className="space-y-6">
      <section className="relative overflow-hidden rounded-[34px] border border-white/10 bg-[linear-gradient(135deg,#10233c_0%,#133a65_45%,#1a7fd0_100%)] p-8 shadow-[0_32px_80px_rgba(2,12,27,0.34)] sm:p-10">
        <div className="absolute -right-10 top-0 h-48 w-48 rounded-full bg-cyan-300/20 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-40 w-40 rounded-full bg-blue-500/20 blur-3xl" />

        <div className="relative grid gap-8 xl:grid-cols-[minmax(0,1.2fr)_420px]">
          <div>
            <div className="inline-flex items-center rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200">
              Dashboard premium
            </div>

            <h1 className="mt-4 max-w-3xl text-4xl font-bold tracking-tight text-white sm:text-5xl">
              Bonjour {user?.firstName || "Utilisateur"}
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-200 sm:text-[15px]">
              Pilotez la maintenance sans chercher quoi faire : l’application
              remonte les priorités, vérifie les rappels et garde une trace des
              actions importantes.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/dashboard/contracts?filter=upcoming"
                className="rounded-2xl bg-white px-5 py-3 font-semibold text-slate-950 shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl"
              >
                Voir les urgences
              </Link>

              <Link
                href="/dashboard/planning"
                className="rounded-2xl border border-white/15 bg-white/10 px-5 py-3 font-semibold text-white transition hover:-translate-y-0.5 hover:bg-white/15"
              >
                Ouvrir le planning
              </Link>
            </div>
          </div>

          <div className="rounded-[30px] border border-white/10 bg-white/10 p-6 backdrop-blur">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-200">
                  Automatisation
                </p>
                <h2 className="mt-3 text-2xl font-bold text-white">
                  {automationIsHealthy ? "Active et opérationnelle" : "À vérifier"}
                </h2>
              </div>

              <div
                className={`rounded-2xl p-3 ${
                  automationIsHealthy ? "bg-emerald-400/15" : "bg-red-400/15"
                }`}
              >
                <Bot
                  className={`h-7 w-7 ${
                    automationIsHealthy ? "text-emerald-200" : "text-red-200"
                  }`}
                />
              </div>
            </div>

            <div className="mt-5 grid gap-3 text-sm text-slate-100">
              <div className="rounded-2xl bg-white/10 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.16em] text-slate-300">
                  Dernière exécution
                </p>
                <p className="mt-1 font-semibold text-white">
                  {formatDateTime(lastAutomationRun?.endedAt || lastAutomationRun?.createdAt || null)}
                </p>
              </div>

              <div className="rounded-2xl bg-white/10 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.16em] text-slate-300">
                  Prochaine exécution
                </p>
                <p className="mt-1 font-semibold text-white">
                  {formatDateTime(getNextCronDate())}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <MiniMetric label="Envoyés" value={lastAutomationRun?.sentCount ?? 0} />
                <MiniMetric label="Ignorés" value={lastAutomationRun?.skippedCount ?? 0} />
                <MiniMetric label="Échecs" value={lastAutomationRun?.failedCount ?? 0} />
              </div>
            </div>

            <RunRemindersButton />
          </div>
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          href="/dashboard/clients"
          label="Clients"
          value={clientsCount}
          icon={<FolderKanban className="h-5 w-5 text-slate-400" />}
          barClass="bg-sky-500"
        />

        <KpiCard
          href="/dashboard/contracts?filter=active"
          label="Contrats actifs"
          value={contractsCount}
          icon={<FileText className="h-5 w-5 text-slate-400" />}
          barClass="bg-cyan-500"
        />

        <KpiCard
          href="/dashboard/contracts?filter=upcoming"
          label="À venir J-30"
          value={upcomingCount}
          icon={<CalendarClock className="h-5 w-5 text-slate-400" />}
          barClass="bg-amber-500"
        />

        <KpiCard
          href="/dashboard/contracts?filter=overdue"
          label="En retard"
          value={overdueCount}
          icon={<AlertTriangle className="h-5 w-5 text-slate-400" />}
          barClass="bg-red-500"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <section className="rounded-[32px] border border-white/70 bg-white/90 p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-sky-600">
                Actions à traiter
              </p>
              <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-950">
                Ce qui mérite votre attention
              </h2>
            </div>
            <ShieldCheck className="h-6 w-6 text-emerald-500" />
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <ActionCard
              href="/dashboard/contracts?filter=upcoming"
              icon={<CalendarClock className="h-5 w-5" />}
              label="Maintenances à planifier"
              value={maintenancesToPlanCount}
              helper="Contrats proches sans rendez-vous futur."
              tone={maintenancesToPlanCount > 0 ? "amber" : "emerald"}
            />

            <ActionCard
              href="/dashboard/contracts"
              icon={<MailCheck className="h-5 w-5" />}
              label="Confirmations à envoyer"
              value={confirmationsToSend}
              helper="Interventions planifiées non confirmées au client."
              tone={confirmationsToSend > 0 ? "amber" : "emerald"}
            />

            <ActionCard
              href="/dashboard/planning"
              icon={<AlertTriangle className="h-5 w-5" />}
              label="Interventions en retard"
              value={lateInterventionsCount}
              helper="Rendez-vous passés encore non terminés."
              tone={lateInterventionsCount > 0 ? "red" : "emerald"}
            />
          </div>
        </section>

        <section className="rounded-[32px] border border-white/70 bg-white/90 p-6 shadow-sm">
          <p className="text-sm font-semibold text-sky-600">Aujourd’hui</p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-950">
            Planning terrain
          </h2>

          <div className="mt-6 space-y-3">
            {todayInterventions.length === 0 ? (
              <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-sm text-slate-500">
                Aucune intervention planifiée aujourd’hui.
              </div>
            ) : (
              todayInterventions.map((intervention) => (
                <Link
                  key={intervention.id}
                  href={`/dashboard/interventions/${intervention.id}/edit`}
                  className="block rounded-[24px] border border-slate-200 bg-white px-5 py-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold text-slate-950">
                        {intervention.contract.client.firstName}{" "}
                        {intervention.contract.client.lastName}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        {intervention.contract.equipmentType}
                      </p>
                    </div>
                    <span className="rounded-full bg-sky-50 px-3 py-1 text-sm font-semibold text-sky-700 ring-1 ring-sky-100">
                      {new Date(intervention.plannedDate || "").toLocaleTimeString("fr-FR", {
                        hour: "2-digit",
                        minute: "2-digit",
                        timeZone: "Europe/Paris",
                      })}
                    </span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </section>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_420px]">
        <section className="rounded-[32px] border border-white/70 bg-white/90 p-6 shadow-sm">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-sky-600">
                Prochaines échéances
              </p>
              <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-950">
                Contrats à surveiller
              </h2>
            </div>

            <Link
              href="/dashboard/contracts"
              className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Voir tout
            </Link>
          </div>

          <div className="space-y-3">
            {nextContracts.length === 0 ? (
              <div className="rounded-[26px] border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
                Aucun contrat enregistré.
              </div>
            ) : (
              nextContracts.map((contract) => {
                const days = getDaysUntilMaintenance(
                  contract.nextMaintenanceDate,
                );

                return (
                  <Link
                    key={contract.id}
                    href={`/dashboard/contracts/${contract.id}`}
                    className="group flex flex-wrap items-center justify-between gap-4 rounded-[24px] border border-slate-100 bg-slate-50/80 px-5 py-4 transition hover:-translate-y-0.5 hover:border-slate-200 hover:bg-white hover:shadow-md"
                  >
                    <div>
                      <p className="font-semibold text-slate-950 transition group-hover:text-sky-600">
                        {contract.client.firstName} {contract.client.lastName}
                      </p>

                      <p className="mt-1 text-sm text-slate-500">
                        {contract.equipmentType} • {formatDate(contract.nextMaintenanceDate)}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <span
                        className={`rounded-full px-3 py-1 text-sm font-semibold ${getPriorityClass(days)}`}
                      >
                        {getPriorityLabel(days)}
                      </span>

                      <ArrowRight className="h-4 w-4 text-slate-400 transition group-hover:translate-x-1 group-hover:text-sky-600" />
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </section>

        <section className="rounded-[32px] border border-white/70 bg-white/90 p-6 shadow-sm">
          <p className="text-sm font-semibold text-sky-600">Focus terrain</p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-950">
            Priorités du moment
          </h2>

          <div className="mt-6 space-y-4">
            {urgentContracts.length === 0 ? (
              <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-sm text-slate-500">
                Aucune urgence détectée. Le portefeuille contrats est sous
                contrôle.
              </div>
            ) : (
              urgentContracts.map((contract) => {
                const days = getDaysUntilMaintenance(
                  contract.nextMaintenanceDate,
                );

                return (
                  <Link
                    key={contract.id}
                    href={`/dashboard/contracts/${contract.id}`}
                    className="block rounded-[24px] border border-slate-200 bg-white px-5 py-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-semibold text-slate-950">
                          {contract.client.firstName} {contract.client.lastName}
                        </p>

                        <p className="mt-1 text-sm text-slate-500">
                          {contract.equipmentType}
                        </p>
                      </div>

                      <span
                        className={`rounded-full px-3 py-1 text-sm font-semibold ${getPriorityClass(days)}`}
                      >
                        {getPriorityLabel(days)}
                      </span>
                    </div>

                    <p className="mt-4 text-sm text-slate-500">
                      Échéance :{" "}
                      <span className="font-semibold text-slate-700">
                        {formatDate(contract.nextMaintenanceDate)}
                      </span>
                    </p>
                  </Link>
                );
              })
            )}
          </div>
        </section>
      </section>
    </main>
  );
}

function MiniMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-white/10 px-3 py-2 text-center">
      <p className="text-lg font-bold text-white">{value}</p>
      <p className="text-[11px] font-medium text-slate-300">{label}</p>
    </div>
  );
}

function KpiCard({
  href,
  label,
  value,
  icon,
  barClass,
}: {
  href: string;
  label: string;
  value: number;
  icon: ReactNode;
  barClass: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-[30px] border border-white/70 bg-white/90 p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-[0_24px_44px_rgba(15,23,42,0.12)]"
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        {icon}
      </div>

      <p className="mt-4 text-4xl font-bold tracking-tight text-slate-950">
        {value}
      </p>

      <div className={`mt-5 h-1.5 w-16 rounded-full ${barClass}`} />
    </Link>
  );
}

function ActionCard({
  href,
  icon,
  label,
  value,
  helper,
  tone,
}: {
  href: string;
  icon: ReactNode;
  label: string;
  value: number;
  helper: string;
  tone: "amber" | "emerald" | "red";
}) {
  const toneClass = {
    amber: "bg-amber-50 text-amber-700 ring-amber-100",
    emerald: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    red: "bg-red-50 text-red-700 ring-red-100",
  }[tone];

  return (
    <Link
      href={href}
      className="rounded-[26px] border border-slate-100 bg-slate-50/80 p-5 transition hover:-translate-y-0.5 hover:bg-white hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-4">
        <div className={`rounded-2xl p-3 ring-1 ${toneClass}`}>{icon}</div>
        <span className="text-3xl font-bold tracking-tight text-slate-950">
          {value}
        </span>
      </div>

      <p className="mt-4 font-semibold text-slate-950">{label}</p>
      <p className="mt-1 text-sm leading-6 text-slate-500">{helper}</p>
    </Link>
  );
}
