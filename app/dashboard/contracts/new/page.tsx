import { prisma } from "@/lib/prisma";
import ContractForm from "./ContractForm";
import BackButton from "@/components/ui/BackButton";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ clientId?: string }>;
}) {
  const { clientId } = await searchParams;

  const clients = await prisma.client.findMany({
    select: {
      id: true,
      firstName: true,
      lastName: true,
    },
  });

  return (
    <div className="p-10">
      <BackButton fallbackHref="/dashboard/contracts" />

      <h1 className="mb-6 text-2xl font-bold">Nouveau contrat</h1>

      <ContractForm clients={clients} initialClientId={clientId || ""} />
    </div>
  );
}
