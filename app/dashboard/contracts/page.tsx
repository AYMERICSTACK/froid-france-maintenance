import Link from "next/link";
import { prisma } from "@/lib/prisma";
import BackButton from "@/components/ui/BackButton";
import {
  getContractStatusLabel,
  getDaysUntilMaintenance,
} from "@/lib/contracts";
import {
  FileText,
  Clock3,
  AlertTriangle,
  Plus,
  RotateCcw,
  Eye,
  Pencil,
  Wrench,
  CalendarDays,
  User,
} from "lucide-react";

type ContractsPageProps = {
  searchParams: Promise<{
    filter?: string;
  }>;
};

function getTabClassName(isActive: boolean) {
  return isActive
    ? "inline-flex items-center rounded-2xl bg-[#0b79d0] px-4 py-2.5 text-sm font-semibold text-white shadow-sm"
    : "inline-flex items-center rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50";
}

function formatDueText(days: number) {
  if (days < 0) {
    return `${Math.abs(days)} jour${Math.abs(days) > 1 ? "s" : ""} de retard`;
  }

  if (days === 0) {
    return "Aujourd’hui";
  }

  return `${days} jour${days > 1 ? "s" : ""}`;
}

export default async function ContractsPage({
  searchParams,
}: ContractsPageProps) {
  const { filter } = await searchParams;

  const allContracts = await prisma.contract.findMany({
    include: {
      client: true,
    },
    orderBy: {
      nextMaintenanceDate: "asc",
    },
  });

  const overdueCount = allContracts.filter(
    (contract) => getDaysUntilMaintenance(contract.nextMaintenanceDate) < 0,
  ).length;

  const upcomingCount = allContracts.filter((contract) => {
    const days = getDaysUntilMaintenance(contract.nextMaintenanceDate);
    return days >= 0 && days <= 30;
  }).length;

  const activeCount = allContracts.filter(
    (contract) => contract.status === "ACTIVE",
  ).length;

  let contracts = allContracts;

  if (filter === "active") {
    contracts = allContracts.filter((contract) => contract.status === "ACTIVE");
  } else if (filter === "upcoming") {
    contracts = allContracts.filter((contract) => {
      const days = getDaysUntilMaintenance(contract.nextMaintenanceDate);
      return days >= 0 && days <= 30;
    });
  } else if (filter === "overdue") {
    contracts = allContracts.filter(
      (contract) => getDaysUntilMaintenance(contract.nextMaintenanceDate) < 0,
    );
  }

  return (
    <main className="space-y-6">
      {/* HEADER */}
      <section className="rounded-[32px] border border-white/70 bg-white/90 p-6 shadow-sm">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-4">
            <BackButton label="Retour dashboard" fallbackHref="/dashboard" />

            <div>
              <div className="inline-flex items-center rounded-full bg-[#0b79d0]/8 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#0b79d0]">
                Gestion contrats
              </div>

              <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                Contrats
              </h1>

              <p className="mt-3 max-w-2xl text-sm text-slate-500">
                Suivez les échéances d’entretien, les contrats actifs et les
                priorités à traiter depuis une vue centralisée.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            {filter ? (
              <Link
                href="/dashboard/contracts"
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                <RotateCcw className="h-4 w-4" />
                Réinitialiser
              </Link>
            ) : null}

            <Link
              href="/dashboard/contracts/new"
              className="inline-flex items-center gap-2 rounded-2xl bg-[#0b79d0] px-5 py-3 font-semibold text-white shadow-md transition hover:-translate-y-0.5 hover:bg-[#0a6dbd] hover:shadow-lg"
            >
              <Plus className="h-4 w-4" />
              Ajouter un contrat
            </Link>
          </div>
        </div>
      </section>

      {/* KPI */}
      <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-[30px] border border-white/70 bg-white/90 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">Total contrats</p>
            <FileText className="h-5 w-5 text-slate-400" />
          </div>
          <p className="mt-4 text-4xl font-bold tracking-tight text-slate-900">
            {allContracts.length}
          </p>
          <div className="mt-5 h-1.5 w-16 rounded-full bg-[#0b79d0]" />
        </div>

        <div className="rounded-[30px] border border-white/70 bg-white/90 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">Actifs</p>
            <FileText className="h-5 w-5 text-slate-400" />
          </div>
          <p className="mt-4 text-4xl font-bold tracking-tight text-slate-900">
            {activeCount}
          </p>
          <div className="mt-5 h-1.5 w-16 rounded-full bg-emerald-500" />
        </div>

        <div className="rounded-[30px] border border-white/70 bg-white/90 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">
              À venir (30 jours)
            </p>
            <Clock3 className="h-5 w-5 text-slate-400" />
          </div>
          <p className="mt-4 text-4xl font-bold tracking-tight text-slate-900">
            {upcomingCount}
          </p>
          <div className="mt-5 h-1.5 w-16 rounded-full bg-amber-500" />
        </div>

        <div className="rounded-[30px] border border-white/70 bg-white/90 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">En retard</p>
            <AlertTriangle className="h-5 w-5 text-slate-400" />
          </div>
          <p className="mt-4 text-4xl font-bold tracking-tight text-red-600">
            {overdueCount}
          </p>
          <div className="mt-5 h-1.5 w-16 rounded-full bg-red-500" />
        </div>
      </section>

      {/* FILTRES */}
      <section className="rounded-[32px] border border-white/70 bg-white/90 p-4 shadow-sm">
        <div className="flex flex-wrap gap-3">
          <Link
            href="/dashboard/contracts"
            className={getTabClassName(!filter)}
          >
            Tous ({allContracts.length})
          </Link>

          <Link
            href="/dashboard/contracts?filter=active"
            className={getTabClassName(filter === "active")}
          >
            Actifs ({activeCount})
          </Link>

          <Link
            href="/dashboard/contracts?filter=upcoming"
            className={getTabClassName(filter === "upcoming")}
          >
            À venir ({upcomingCount})
          </Link>

          <Link
            href="/dashboard/contracts?filter=overdue"
            className={getTabClassName(filter === "overdue")}
          >
            En retard ({overdueCount})
          </Link>
        </div>
      </section>

      {filter ? (
        <div className="rounded-2xl bg-blue-50 px-4 py-3 text-sm text-blue-700">
          Filtre actif :
          <span className="ml-1 font-semibold">
            {filter === "active" && "Contrats actifs"}
            {filter === "upcoming" && "Contrats à venir (30 jours)"}
            {filter === "overdue" && "Contrats en retard"}
          </span>
        </div>
      ) : null}

      <section className="overflow-hidden rounded-[32px] border border-white/70 bg-white/90 shadow-sm">
        <div className="border-b border-slate-100 px-4 py-5 sm:px-6">
          <p className="text-sm font-semibold text-[#0b79d0]">
            Liste des contrats
          </p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
            Contrats enregistrés
          </h2>
        </div>

        {contracts.length === 0 ? (
          <div className="px-6 py-10 text-center">
            <p className="text-sm font-medium text-slate-900">
              Aucun contrat trouvé
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Aucun contrat ne correspond au filtre sélectionné.
            </p>
          </div>
        ) : (
          <>
            {/* Mobile cards */}
            <div className="space-y-3 p-4 sm:hidden">
              {contracts.map((contract) => {
                const days = getDaysUntilMaintenance(
                  contract.nextMaintenanceDate,
                );
                const status = getContractStatusLabel(
                  contract.nextMaintenanceDate,
                );

                return (
                  <div
                    key={contract.id}
                    className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 shrink-0 text-slate-400" />
                          <p className="text-lg font-semibold text-slate-950">
                            {contract.client.firstName}{" "}
                            {contract.client.lastName}
                          </p>
                        </div>

                        <p className="mt-2 text-sm text-slate-500">
                          {contract.client.city || "Ville non renseignée"}
                        </p>
                      </div>

                      <span
                        className={`inline-flex shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${status.color}`}
                      >
                        {status.label}
                      </span>
                    </div>

                    <div className="mt-4 space-y-3 text-sm">
                      <div className="flex items-start gap-2 text-slate-700">
                        <Wrench className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                        <span>{contract.equipmentType}</span>
                      </div>

                      <div className="flex items-start gap-2 text-slate-600">
                        <span className="w-20 shrink-0 text-slate-400">
                          Marque
                        </span>
                        <span>{contract.brand || "-"}</span>
                      </div>

                      <div className="flex items-start gap-2 text-slate-600">
                        <span className="w-20 shrink-0 text-slate-400">
                          Modèle
                        </span>
                        <span>{contract.model || "-"}</span>
                      </div>

                      <div className="flex items-start gap-2 text-slate-600">
                        <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                        <span>
                          {new Date(
                            contract.nextMaintenanceDate,
                          ).toLocaleDateString("fr-FR")}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 rounded-2xl bg-slate-50 px-3 py-3">
                      <p className="text-sm text-slate-500">Échéance</p>
                      <p
                        className={`mt-1 text-sm font-semibold ${
                          days < 0
                            ? "text-red-600"
                            : days <= 30
                              ? "text-amber-600"
                              : "text-slate-700"
                        }`}
                      >
                        {formatDueText(days)}
                      </p>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <Link
                        href={`/dashboard/contracts/${contract.id}`}
                        className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                      >
                        <Eye className="mr-1.5 h-4 w-4" />
                        Voir
                      </Link>

                      <Link
                        href={`/dashboard/contracts/${contract.id}/edit`}
                        className="inline-flex items-center justify-center rounded-xl bg-[#0b79d0] px-3 py-2.5 text-sm font-medium text-white transition hover:bg-[#0a6dbd]"
                      >
                        <Pencil className="mr-1.5 h-4 w-4" />
                        Modifier
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop table */}
            <div className="hidden overflow-x-auto sm:block">
              <table className="w-full min-w-[980px] text-left">
                <thead className="bg-slate-50/80">
                  <tr className="text-sm text-slate-500">
                    <th className="px-6 py-4 font-semibold">Client</th>
                    <th className="px-6 py-4 font-semibold">Équipement</th>
                    <th className="px-6 py-4 font-semibold">Marque</th>
                    <th className="px-6 py-4 font-semibold">Modèle</th>
                    <th className="px-6 py-4 font-semibold">
                      Prochain entretien
                    </th>
                    <th className="px-6 py-4 font-semibold">Échéance</th>
                    <th className="px-6 py-4 font-semibold">Statut</th>
                    <th className="px-6 py-4 text-right font-semibold">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {contracts.map((contract) => {
                    const days = getDaysUntilMaintenance(
                      contract.nextMaintenanceDate,
                    );
                    const status = getContractStatusLabel(
                      contract.nextMaintenanceDate,
                    );

                    return (
                      <tr
                        key={contract.id}
                        className="border-t border-slate-100 transition hover:bg-slate-50/70"
                      >
                        <td className="px-6 py-4">
                          <div className="min-w-0">
                            <Link
                              href={`/dashboard/contracts/${contract.id}`}
                              className="font-semibold text-slate-900 transition hover:text-[#0b79d0]"
                            >
                              {contract.client.firstName}{" "}
                              {contract.client.lastName}
                            </Link>
                            <p className="mt-1 text-sm text-slate-500">
                              {contract.client.city || "Ville non renseignée"}
                            </p>
                          </div>
                        </td>

                        <td className="px-6 py-4 font-medium text-slate-800">
                          {contract.equipmentType}
                        </td>

                        <td className="px-6 py-4 text-slate-600">
                          {contract.brand || "-"}
                        </td>

                        <td className="px-6 py-4 text-slate-600">
                          {contract.model || "-"}
                        </td>

                        <td className="px-6 py-4 text-slate-600">
                          {new Date(
                            contract.nextMaintenanceDate,
                          ).toLocaleDateString("fr-FR")}
                        </td>

                        <td className="px-6 py-4">
                          <span
                            className={`text-sm font-medium ${
                              days < 0
                                ? "text-red-600"
                                : days <= 30
                                  ? "text-amber-600"
                                  : "text-slate-600"
                            }`}
                          >
                            {formatDueText(days)}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${status.color}`}
                          >
                            {status.label}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              href={`/dashboard/contracts/${contract.id}`}
                              className="inline-flex items-center rounded-md px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
                            >
                              <Eye className="mr-1 h-4 w-4" />
                              Voir
                            </Link>

                            <Link
                              href={`/dashboard/contracts/${contract.id}/edit`}
                              className="inline-flex items-center rounded-md bg-[#0b79d0] px-3 py-1.5 text-sm font-medium text-white transition hover:bg-[#0a6dbd]"
                            >
                              <Pencil className="mr-1 h-4 w-4" />
                              Modifier
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>
    </main>
  );
}
