import Link from "next/link";
import { prisma } from "@/lib/prisma";
import BackButton from "@/components/ui/BackButton";
import InterventionForm from "./InterventionForm";
import SendReminderButton from "./SendReminderButton";
import DeleteContractButton from "./DeleteContractButton";
import DocumentsSection from "@/components/documents/DocumentsSection";
import QuickCompleteButton from "@/components/interventions/QuickCompleteButton";
import DeleteInterventionButton from "@/components/interventions/DeleteInterventionButton";

/* =========================
   UTILITAIRES
========================= */

function formatDate(date: Date | string | null) {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("fr-FR");
}

function getFullName(client: { firstName: string; lastName: string }) {
  return `${client.firstName} ${client.lastName}`;
}

function getStatusConfig(status: string, type: "contract" | "intervention") {
  const map = {
    contract: {
      ACTIVE: {
        label: "Actif",
        className:
          "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200",
      },
      INACTIVE: {
        label: "Inactif",
        className:
          "bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-200",
      },
      CANCELLED: {
        label: "Annulé",
        className: "bg-red-50 text-red-700 ring-1 ring-inset ring-red-200",
      },
    },
    intervention: {
      DONE: {
        label: "Faite",
        className:
          "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200",
      },
      PLANNED: {
        label: "Planifiée",
        className:
          "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200",
      },
      TO_PLAN: {
        label: "À planifier",
        className:
          "bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-200",
      },
      CANCELLED: {
        label: "Annulée",
        className: "bg-red-50 text-red-700 ring-1 ring-inset ring-red-200",
      },
    },
  };

  const config = map[type][status as keyof (typeof map)[typeof type]];

  return (
    config || {
      label: status,
      className: "bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-200",
    }
  );
}

/* =========================
   PAGE
========================= */

export default async function ContractDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const contract = await prisma.contract.findUnique({
    where: { id },
    include: {
      client: true,
      interventions: {
        orderBy: [{ plannedDate: "desc" }, { createdAt: "desc" }],
      },
      documents: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!contract) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <p className="text-lg font-semibold text-slate-900">
            Contrat introuvable
          </p>
          <Link
            href="/dashboard/contracts"
            className="mt-4 inline-block text-sm font-medium text-[#0b79d0] hover:underline"
          >
            Retour aux contrats
          </Link>
        </div>
      </main>
    );
  }

  const plannedCount = contract.interventions.filter(
    (i) => i.status === "PLANNED",
  ).length;

  const doneCount = contract.interventions.filter(
    (i) => i.status === "DONE",
  ).length;

  const contractStatus = getStatusConfig(contract.status, "contract");

  return (
    <main className="space-y-6">
      <section className="rounded-[32px] border border-white/70 bg-white/90 p-6 shadow-sm">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-4">
            <BackButton />

            <div>
              <div className="inline-flex items-center rounded-full bg-[#0b79d0]/8 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#0b79d0]">
                Détail du contrat
              </div>

              <h1 className="mt-3 text-3xl font-bold text-slate-900 sm:text-4xl">
                {contract.equipmentType}
              </h1>

              <div className="mt-3 flex flex-wrap items-center gap-3">
                <span className="inline-flex rounded-full bg-slate-50 px-3 py-1.5 text-sm font-medium text-slate-600">
                  Client : {getFullName(contract.client)}
                </span>

                <span
                  className={`inline-flex rounded-full px-3 py-1.5 text-sm font-semibold ${contractStatus.className}`}
                >
                  {contractStatus.label}
                </span>

                {contract.brand && (
                  <span className="inline-flex rounded-full bg-slate-50 px-3 py-1.5 text-sm font-medium text-slate-600">
                    {contract.brand}
                    {contract.model && ` • ${contract.model}`}
                  </span>
                )}
              </div>

              <p className="mt-4 max-w-2xl text-sm text-slate-500">
                Suivez l’équipement, les échéances et les interventions depuis
                une vue centralisée.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href={`/dashboard/contracts/${contract.id}/edit`}
              className="rounded-2xl border border-slate-200 bg-white px-5 py-3 font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Modifier
            </Link>

            <DeleteContractButton contractId={contract.id} />
          </div>
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Équipement"
          value={contract.equipmentType}
          icon="🛠"
          color="bg-[#0b79d0]"
        />

        <StatCard
          label="Statut"
          value={contractStatus.label}
          icon="🛡️"
          color="bg-emerald-500"
        />

        <StatCard
          label="Prochain entretien"
          value={formatDate(contract.nextMaintenanceDate)}
          icon="📅"
          color="bg-amber-500"
        />

        <StatCard
          label="Fréquence"
          value={`${contract.frequencyMonths} mois`}
          icon="⏱️"
          color="bg-violet-500"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <section className="rounded-[32px] border border-white/70 bg-white/90 p-6 shadow-sm">
            <h2 className="text-2xl font-bold text-slate-900">
              Actions rapides
            </h2>

            <div className="mt-6 space-y-4">
              <InterventionForm contractId={contract.id} />
              <SendReminderButton contractId={contract.id} />
            </div>
          </section>

          <section className="rounded-[32px] border border-white/70 bg-white/90 p-6 shadow-sm">
            <h2 className="text-2xl font-bold text-slate-900">Interventions</h2>

            {contract.interventions.length === 0 ? (
              <EmptyState text="Aucune intervention" />
            ) : (
              <div className="mt-6 space-y-4">
                {contract.interventions.map((intervention) => {
                  const status = getStatusConfig(
                    intervention.status,
                    "intervention",
                  );

                  return (
                    <div
                      key={intervention.id}
                      className="rounded-3xl border border-slate-200 bg-slate-50/70 p-5"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${status.className}`}
                        >
                          {status.label}
                        </span>

                        <div className="flex flex-wrap items-center gap-2">
                          {intervention.status !== "DONE" && (
                            <QuickCompleteButton
                              interventionId={intervention.id}
                            />
                          )}

                          <Link
                            href={`/dashboard/interventions/${intervention.id}/edit`}
                            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                          >
                            Modifier
                          </Link>

                          <DeleteInterventionButton
                            interventionId={intervention.id}
                          />
                        </div>
                      </div>

                      <p className="mt-3 text-sm text-slate-500">
                        Prévue : {formatDate(intervention.plannedDate)}
                      </p>

                      <p className="mt-1 text-sm text-slate-500">
                        Réalisée : {formatDate(intervention.doneDate)}
                      </p>

                      <p className="mt-3 text-sm text-slate-700">
                        {intervention.notes || "Aucune note"}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-[32px] border border-white/70 bg-white/90 p-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900">Résumé</h2>

            <div className="mt-4 space-y-3 text-sm text-slate-700">
              <div>📄 {contract.documents.length} document(s)</div>
              <div>🛠 {plannedCount} planifiée(s)</div>
              <div>✅ {doneCount} réalisée(s)</div>
              <div>👤 {getFullName(contract.client)}</div>
            </div>
          </section>

          <DocumentsSection
            title="Documents"
            subtitle="Fichiers"
            contractId={contract.id}
            clientId={contract.client.id}
            documents={contract.documents}
          />
        </div>
      </section>
    </main>
  );
}

/* =========================
   COMPOSANTS
========================= */

function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string;
  icon: string;
  color: string;
}) {
  return (
    <div className="rounded-[30px] border border-white/70 bg-white/90 p-6 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-slate-500">{label}</p>
        <span className="text-lg">{icon}</span>
      </div>

      <p className="mt-4 font-semibold text-slate-900">{value}</p>
      <div className={`mt-4 h-1.5 w-16 rounded-full ${color}`} />
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
      {text}
    </div>
  );
}
