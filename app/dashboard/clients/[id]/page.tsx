import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import BackButton from "@/components/ui/BackButton";
import DocumentsSection from "@/components/documents/DocumentsSection";
import {
  Mail,
  Phone,
  MapPin,
  FileText,
  AlertTriangle,
  Clock,
} from "lucide-react";

function formatDate(date: Date | string | null) {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("fr-FR");
}

function formatDateTime(date: Date | string | null) {
  if (!date) return "-";
  return new Date(date).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getContractStatus(nextMaintenanceDate: Date | string) {
  const today = new Date();
  const nextDate = new Date(nextMaintenanceDate);

  const todayStart = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );

  const nextStart = new Date(
    nextDate.getFullYear(),
    nextDate.getMonth(),
    nextDate.getDate(),
  );

  const diffMs = nextStart.getTime() - todayStart.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return {
      label: "En retard",
      className: "bg-red-50 text-red-700 ring-1 ring-inset ring-red-200",
    };
  }

  if (diffDays <= 30) {
    return {
      label: "À venir",
      className: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200",
    };
  }

  return {
    label: "Planifié",
    className:
      "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200",
  };
}

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const client = await prisma.client.findUnique({
    where: { id },
    include: {
      contracts: {
        orderBy: {
          nextMaintenanceDate: "asc",
        },
        include: {
          interventions: {
            where: {
              status: "PLANNED",
              plannedDate: {
                not: null,
              },
            },
            orderBy: {
              plannedDate: "asc",
            },
          },
        },
      },
      documents: {
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

  if (!client) {
    notFound();
  }

  const today = new Date();
  const todayStart = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );

  const contractsCount = client.contracts.length;

  const overdueCount = client.contracts.filter((contract) => {
    const next = new Date(contract.nextMaintenanceDate);
    const nextStart = new Date(
      next.getFullYear(),
      next.getMonth(),
      next.getDate(),
    );
    return nextStart.getTime() < todayStart.getTime();
  }).length;

  const upcomingCount = client.contracts.filter((contract) => {
    const next = new Date(contract.nextMaintenanceDate);
    const nextStart = new Date(
      next.getFullYear(),
      next.getMonth(),
      next.getDate(),
    );
    const diffDays = Math.ceil(
      (nextStart.getTime() - todayStart.getTime()) / (1000 * 60 * 60 * 24),
    );
    return diffDays >= 0 && diffDays <= 30;
  }).length;

  const nextMaintenance =
    client.contracts.length > 0
      ? client.contracts[0]?.nextMaintenanceDate
      : null;

  const nextPlannedIntervention = client.contracts
    .flatMap((contract) =>
      contract.interventions.map((intervention) => ({
        ...intervention,
        contract,
      })),
    )
    .filter((intervention) => intervention.plannedDate)
    .sort(
      (a, b) =>
        new Date(a.plannedDate!).getTime() -
        new Date(b.plannedDate!).getTime(),
    )[0];

  return (
    <main className="space-y-6">
      {/* HEADER PREMIUM */}
      <section className="rounded-[32px] border border-white/70 bg-white/90 p-6 shadow-sm">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-4">
            <BackButton fallbackHref="/dashboard/clients" />

            <div>
              <div className="inline-flex items-center rounded-full bg-[#0b79d0]/8 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#0b79d0]">
                Fiche client
              </div>

              <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                {client.firstName} {client.lastName}
              </h1>

              <div className="mt-3 flex flex-wrap gap-3 text-sm text-slate-500">
                {client.email && (
                  <span className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1.5">
                    <Mail className="h-4 w-4 text-slate-400" />
                    {client.email}
                  </span>
                )}

                {client.phone && (
                  <span className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1.5">
                    <Phone className="h-4 w-4 text-slate-400" />
                    {client.phone}
                  </span>
                )}

                {client.city && (
                  <span className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1.5">
                    <MapPin className="h-4 w-4 text-slate-400" />
                    {client.city}
                  </span>
                )}
              </div>

              <p className="mt-4 max-w-2xl text-sm text-slate-500">
                Consultez les informations du client, ses contrats liés et les
                documents centralisés dans un seul espace.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href={`/dashboard/clients/${client.id}/edit`}
              className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:bg-slate-50"
            >
              Modifier le client
            </Link>

            <Link
              href={`/dashboard/contracts/new?clientId=${client.id}`}
              className="inline-flex items-center justify-center rounded-2xl bg-[#0b79d0] px-5 py-3 font-semibold text-white shadow-md transition hover:-translate-y-0.5 hover:bg-[#0a6dbd] hover:shadow-lg"
            >
              Ajouter un contrat
            </Link>
          </div>
        </div>
      </section>

      {/* KPI */}
      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-[30px] border border-white/70 bg-white/90 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">Contrats</p>
            <FileText className="h-5 w-5 text-slate-400" />
          </div>
          <p className="mt-4 text-4xl font-bold tracking-tight text-slate-900">
            {contractsCount}
          </p>
          <div className="mt-5 h-1.5 w-16 rounded-full bg-[#0b79d0]" />
        </div>

        <div className="rounded-[30px] border border-white/70 bg-white/90 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">
              {nextPlannedIntervention
                ? "Prochaine intervention"
                : "Prochain entretien"}
            </p>
            <Clock className="h-5 w-5 text-slate-400" />
          </div>
          <p className="mt-4 text-base font-semibold text-slate-900">
            {nextPlannedIntervention
              ? formatDateTime(nextPlannedIntervention.plannedDate)
              : formatDate(nextMaintenance)}
          </p>
          {nextPlannedIntervention && (
            <p className="mt-2 text-xs font-medium text-emerald-700">
              Confirmation {nextPlannedIntervention.confirmationSentAt ? "envoyée" : "à envoyer"}
            </p>
          )}
          <div className="mt-5 h-1.5 w-16 rounded-full bg-emerald-500" />
        </div>

        <div className="rounded-[30px] border border-white/70 bg-white/90 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">À venir (30j)</p>
            <Clock className="h-5 w-5 text-slate-400" />
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

      {/* GRID PRINCIPALE */}
      <section className="grid gap-6 xl:grid-cols-3">
        {/* COLONNE GAUCHE */}
        <div className="space-y-6 xl:col-span-2">
          {/* INFOS CLIENT */}
          <section className="rounded-[32px] border border-white/70 bg-white/90 p-6 shadow-sm">
            <div className="mb-6">
              <p className="text-sm font-semibold text-[#0b79d0]">
                Informations client
              </p>
              <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
                Coordonnées et notes
              </h2>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div className="rounded-2xl bg-slate-50/80 px-4 py-4">
                <p className="text-sm text-slate-500">Prénom</p>
                <p className="mt-1 font-semibold text-slate-900">
                  {client.firstName}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50/80 px-4 py-4">
                <p className="text-sm text-slate-500">Nom</p>
                <p className="mt-1 font-semibold text-slate-900">
                  {client.lastName}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50/80 px-4 py-4">
                <p className="text-sm text-slate-500">Téléphone</p>
                <p className="mt-1 font-semibold text-slate-900">
                  {client.phone || "-"}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50/80 px-4 py-4">
                <p className="text-sm text-slate-500">Email</p>
                <p className="mt-1 break-words font-semibold text-slate-900">
                  {client.email || "-"}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50/80 px-4 py-4 md:col-span-2">
                <p className="text-sm text-slate-500">Adresse</p>
                <p className="mt-1 font-semibold text-slate-900">
                  {client.address || "-"}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50/80 px-4 py-4">
                <p className="text-sm text-slate-500">Ville</p>
                <p className="mt-1 font-semibold text-slate-900">
                  {client.city || "-"}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50/80 px-4 py-4">
                <p className="text-sm text-slate-500">Code postal</p>
                <p className="mt-1 font-semibold text-slate-900">
                  {client.postalCode || "-"}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50/80 px-4 py-4 md:col-span-2">
                <p className="text-sm text-slate-500">Notes</p>
                <p className="mt-1 whitespace-pre-line font-semibold text-slate-900">
                  {client.notes || "Aucune note"}
                </p>
              </div>
            </div>
          </section>

          {/* CONTRATS */}
          <section className="rounded-[32px] border border-white/70 bg-white/90 p-6 shadow-sm">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-[#0b79d0]">
                  Contrats liés
                </p>
                <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
                  Contrats du client
                </h2>
              </div>

              <Link
                href={`/dashboard/contracts/new?clientId=${client.id}`}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Ajouter un contrat
              </Link>
            </div>

            {client.contracts.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                Aucun contrat lié à ce client pour le moment.
              </div>
            ) : (
              <div className="space-y-3">
                {client.contracts.map((contract) => {
                  const status = getContractStatus(
                    contract.nextMaintenanceDate,
                  );

                  return (
                    <Link
                      key={contract.id}
                      href={`/dashboard/contracts/${contract.id}`}
                      className="group flex flex-col gap-4 rounded-2xl border border-slate-100 bg-slate-50/80 px-5 py-4 transition hover:-translate-y-0.5 hover:border-slate-200 hover:bg-white hover:shadow-md sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-slate-900 transition group-hover:text-[#0b79d0]">
                            {contract.equipmentType}
                          </p>

                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${status.className}`}
                          >
                            {status.label}
                          </span>
                        </div>

                        <p className="mt-1 text-sm text-slate-500">
                          {contract.brand || "-"}
                          {contract.model ? ` • ${contract.model}` : ""}
                        </p>
                      </div>

                      <div className="shrink-0 text-left sm:text-right">
                        {contract.interventions[0] ? (
                          <>
                            <p className="text-sm text-slate-500">
                              Intervention planifiée
                            </p>
                            <p className="mt-1 font-semibold text-slate-900">
                              {formatDateTime(contract.interventions[0].plannedDate)}
                            </p>
                            <p className="mt-1 text-xs font-medium text-emerald-700">
                              {contract.interventions[0].confirmationSentAt
                                ? "Confirmation envoyée"
                                : "Confirmation à envoyer"}
                            </p>
                          </>
                        ) : (
                          <>
                            <p className="text-sm text-slate-500">
                              Prochain entretien
                            </p>
                            <p className="mt-1 font-semibold text-slate-900">
                              {formatDate(contract.nextMaintenanceDate)}
                            </p>
                          </>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        {/* COLONNE DROITE */}
        <div className="space-y-6">
          <DocumentsSection
            title="Documents du client"
            subtitle="Documents"
            clientId={client.id}
            documents={client.documents}
          />

          <section className="rounded-[32px] border border-white/70 bg-white/90 p-6 shadow-sm">
            <div className="mb-6">
              <p className="text-sm font-semibold text-[#0b79d0]">Activité</p>
              <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
                Vue rapide
              </h2>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl bg-slate-50/80 px-4 py-4">
                <p className="text-sm text-slate-500">Documents</p>
                <p className="mt-1 font-semibold text-slate-900">
                  {client.documents.length} fichier
                  {client.documents.length > 1 ? "s" : ""}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50/80 px-4 py-4">
                <p className="text-sm text-slate-500">Contrats actifs</p>
                <p className="mt-1 font-semibold text-slate-900">
                  {client.contracts.length}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50/80 px-4 py-4">
                <p className="text-sm text-slate-500">
                  {nextPlannedIntervention
                    ? "Prochaine intervention"
                    : "Prochain entretien connu"}
                </p>
                <p className="mt-1 font-semibold text-slate-900">
                  {nextPlannedIntervention
                    ? formatDateTime(nextPlannedIntervention.plannedDate)
                    : formatDate(nextMaintenance)}
                </p>
                {nextPlannedIntervention && (
                  <p className="mt-1 text-xs font-medium text-emerald-700">
                    {nextPlannedIntervention.confirmationSentAt
                      ? "Confirmation envoyée"
                      : "Confirmation à envoyer"}
                  </p>
                )}
              </div>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
