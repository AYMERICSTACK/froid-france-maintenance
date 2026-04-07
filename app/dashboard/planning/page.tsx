import { prisma } from "@/lib/prisma";
import BackButton from "@/components/ui/BackButton";
import PlanningCalendar from "./PlanningCalendar";

export default async function PlanningPage() {
  const contracts = await prisma.contract.findMany({
    include: {
      client: true,
    },
    orderBy: {
      nextMaintenanceDate: "asc",
    },
  });

  const interventions = await prisma.intervention.findMany({
    where: {
      status: "PLANNED",
      plannedDate: {
        not: null,
      },
    },
    include: {
      contract: {
        include: {
          client: true,
        },
      },
    },
    orderBy: {
      plannedDate: "asc",
    },
  });

  const events = [
    ...contracts.map((contract) => ({
      id: `contract-${contract.id}`,
      title: `${contract.client.firstName} ${contract.client.lastName} • ${contract.equipmentType}`,
      date: contract.nextMaintenanceDate,
      color: "#0b79d0",
      extendedProps: {
        contractId: contract.id,
        type: "contract" as const,
      },
    })),

    ...interventions.map((intervention) => ({
      id: `intervention-${intervention.id}`,
      title: `Intervention • ${intervention.contract.client.firstName} ${intervention.contract.client.lastName}`,
      date: intervention.plannedDate!,
      color: "#e3342f",
      extendedProps: {
        contractId: intervention.contract.id,
        interventionId: intervention.id,
        type: "intervention" as const,
      },
    })),
  ];

  const contractOptions = contracts.map((contract) => ({
    id: contract.id,
    label: `${contract.client.firstName} ${contract.client.lastName} • ${contract.equipmentType}${
      contract.brand ? ` • ${contract.brand}` : ""
    }${contract.model ? ` • ${contract.model}` : ""}`,
  }));

  const contractsCount = events.filter(
    (event) => event.extendedProps.type === "contract",
  ).length;

  const interventionsCount = events.filter(
    (event) => event.extendedProps.type === "intervention",
  ).length;

  return (
    <main className="space-y-6">
      <section className="rounded-[32px] border border-white/70 bg-white/90 p-6 shadow-sm">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-4">
            <BackButton fallbackHref="/dashboard" />

            <div>
              <div className="inline-flex items-center rounded-full bg-[#0b79d0]/8 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#0b79d0]">
                Planning
              </div>

              <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                Calendrier
              </h1>

              <p className="mt-3 max-w-2xl text-sm text-slate-500">
                Visualisez les maintenances à venir et les interventions
                planifiées dans une vue claire, exploitable et responsive.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-3">
        <div className="rounded-[30px] border border-white/70 bg-white/90 p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Événements</p>
          <p className="mt-4 text-4xl font-bold tracking-tight text-slate-950">
            {events.length}
          </p>
          <div className="mt-5 h-1.5 w-16 rounded-full bg-[#0b79d0]" />
        </div>

        <div className="rounded-[30px] border border-white/70 bg-white/90 p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Contrats</p>
          <p className="mt-4 text-4xl font-bold tracking-tight text-slate-950">
            {contractsCount}
          </p>
          <div className="mt-5 h-1.5 w-16 rounded-full bg-cyan-500" />
        </div>

        <div className="rounded-[30px] border border-white/70 bg-white/90 p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Interventions</p>
          <p className="mt-4 text-4xl font-bold tracking-tight text-slate-950">
            {interventionsCount}
          </p>
          <div className="mt-5 h-1.5 w-16 rounded-full bg-red-500" />
        </div>
      </section>

      <PlanningCalendar events={events} contracts={contractOptions} />
    </main>
  );
}
