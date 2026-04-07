import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getDaysUntilMaintenance } from "@/lib/contracts";
import RunRemindersButton from "@/components/reminders/RunRemindersButton";
import {
  AlertTriangle,
  CalendarClock,
  FileText,
  FolderKanban,
  ArrowRight,
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

export default async function DashboardPage() {
  const user = await getCurrentUser();

  const [clientsCount, activeContracts] = await Promise.all([
    prisma.client.count(),
    prisma.contract.findMany({
      where: { status: "ACTIVE" },
      include: { client: true },
      orderBy: { nextMaintenanceDate: "asc" },
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

  const nextContracts = activeContracts.slice(0, 6);

  const urgentContracts = activeContracts
    .filter(
      (contract) => getDaysUntilMaintenance(contract.nextMaintenanceDate) <= 30,
    )
    .slice(0, 3);

  return (
    <main className="space-y-6">
      <section className="relative overflow-hidden rounded-[34px] border border-white/10 bg-[linear-gradient(135deg,#10233c_0%,#133a65_45%,#1a7fd0_100%)] p-8 shadow-[0_32px_80px_rgba(2,12,27,0.34)] sm:p-10">
        <div className="absolute -right-10 top-0 h-48 w-48 rounded-full bg-cyan-300/20 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-40 w-40 rounded-full bg-blue-500/20 blur-3xl" />

        <div className="relative grid gap-8 xl:grid-cols-[minmax(0,1.2fr)_380px]">
          <div>
            <div className="inline-flex items-center rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200">
              Dashboard premium
            </div>

            <h1 className="mt-4 max-w-3xl text-4xl font-bold tracking-tight text-white sm:text-5xl">
              Bonjour {user?.firstName || "Utilisateur"}
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-200 sm:text-[15px]">
              Supervisez l’activité, anticipez les maintenances critiques et
              gardez une vision claire sur l’ensemble des contrats en cours.
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
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-200">
              Priorité immédiate
            </p>

            <h2 className="mt-3 text-2xl font-bold text-white">
              {overdueCount > 0
                ? `${overdueCount} contrat(s) en retard`
                : "Situation maîtrisée"}
            </h2>

            <p className="mt-3 text-sm leading-6 text-slate-200">
              {overdueCount > 0
                ? "Des échéances nécessitent une action rapide pour éviter les oublis de maintenance."
                : "Aucune situation critique détectée pour le moment. L’activité reste sous contrôle."}
            </p>

            <div className="mt-6 grid gap-3">
              <div className="rounded-2xl bg-white/10 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.16em] text-slate-300">
                  À venir sous 30 jours
                </p>
                <p className="mt-1 text-2xl font-bold text-white">
                  {upcomingCount}
                </p>
              </div>

              <div className="rounded-2xl bg-white/10 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.16em] text-slate-300">
                  Contrats actifs
                </p>
                <p className="mt-1 text-2xl font-bold text-white">
                  {contractsCount}
                </p>
              </div>
            </div>

            <RunRemindersButton />
          </div>
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <Link
          href="/dashboard/clients"
          className="rounded-[30px] border border-white/70 bg-white/90 p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-[0_24px_44px_rgba(15,23,42,0.12)]"
        >
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">Clients</p>
            <FolderKanban className="h-5 w-5 text-slate-400" />
          </div>

          <p className="mt-4 text-4xl font-bold tracking-tight text-slate-950">
            {clientsCount}
          </p>

          <div className="mt-5 h-1.5 w-16 rounded-full bg-sky-500" />
        </Link>

        <Link
          href="/dashboard/contracts?filter=active"
          className="rounded-[30px] border border-white/70 bg-white/90 p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-[0_24px_44px_rgba(15,23,42,0.12)]"
        >
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">
              Contrats actifs
            </p>
            <FileText className="h-5 w-5 text-slate-400" />
          </div>

          <p className="mt-4 text-4xl font-bold tracking-tight text-slate-950">
            {contractsCount}
          </p>

          <div className="mt-5 h-1.5 w-16 rounded-full bg-cyan-500" />
        </Link>

        <Link
          href="/dashboard/contracts?filter=upcoming"
          className="rounded-[30px] border border-white/70 bg-white/90 p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-[0_24px_44px_rgba(15,23,42,0.12)]"
        >
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">À venir J-30</p>
            <CalendarClock className="h-5 w-5 text-slate-400" />
          </div>

          <p className="mt-4 text-4xl font-bold tracking-tight text-slate-950">
            {upcomingCount}
          </p>

          <div className="mt-5 h-1.5 w-16 rounded-full bg-amber-500" />
        </Link>

        <Link
          href="/dashboard/contracts?filter=overdue"
          className="rounded-[30px] border border-white/70 bg-white/90 p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-[0_24px_44px_rgba(15,23,42,0.12)]"
        >
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">En retard</p>
            <AlertTriangle className="h-5 w-5 text-slate-400" />
          </div>

          <p className="mt-4 text-4xl font-bold tracking-tight text-slate-950">
            {overdueCount}
          </p>

          <div className="mt-5 h-1.5 w-16 rounded-full bg-red-500" />
        </Link>
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
                        {contract.equipmentType}
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
                        {new Date(
                          contract.nextMaintenanceDate,
                        ).toLocaleDateString("fr-FR")}
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
