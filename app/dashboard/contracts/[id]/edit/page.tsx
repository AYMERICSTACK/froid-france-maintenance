import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import BackButton from "@/components/ui/BackButton";
import EditContractForm from "./EditContractForm";

function formatDateInput(date: Date | null) {
  if (!date) return "";
  return new Date(date).toISOString().split("T")[0];
}

export default async function EditContractPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const contract = await prisma.contract.findUnique({
    where: { id },
    include: {
      client: true,
    },
  });

  if (!contract) {
    notFound();
  }

  return (
    <main>
      <div className="mb-6 flex items-center gap-3">
        <BackButton />
        <div>
          <p className="text-sm font-semibold text-[#0b79d0]">
            Modifier un contrat
          </p>
          <h1 className="text-3xl font-bold text-slate-900">
            {contract.client.firstName} {contract.client.lastName}
          </h1>
        </div>
      </div>

      <div className="mb-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <p className="text-sm text-slate-500">Client</p>
        <p className="font-semibold text-slate-900">
          {contract.client.firstName} {contract.client.lastName}
        </p>
      </div>

      <EditContractForm
        contractId={contract.id}
        initialData={{
          equipmentType: contract.equipmentType,
          brand: contract.brand ?? "",
          model: contract.model ?? "",
          subscriptionDate: formatDateInput(contract.subscriptionDate),
          lastMaintenanceDate: formatDateInput(contract.lastMaintenanceDate),
          nextMaintenanceDate: formatDateInput(contract.nextMaintenanceDate),
          frequencyMonths: contract.frequencyMonths,
          status: contract.status,
          notes: contract.notes ?? "",
        }}
      />
    </main>
  );
}
