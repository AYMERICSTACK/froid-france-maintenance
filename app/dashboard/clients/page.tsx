import { prisma } from "@/lib/prisma";
import ClientsTable from "./ClientsTable";

export default async function ClientsPage() {
  const clients = await prisma.client.findMany({
    include: {
      contracts: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return <ClientsTable clients={clients} />;
}
