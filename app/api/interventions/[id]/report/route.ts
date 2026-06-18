import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { createSimplePdf } from "@/lib/pdf";

function formatDate(date: Date | null) {
  if (!date) return "-";
  return date.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      { success: false, message: "Non autorisé." },
      { status: 401 },
    );
  }

  const { id } = await params;

  const intervention = await prisma.intervention.findUnique({
    where: { id },
    include: {
      contract: { include: { client: true } },
      documents: true,
    },
  });

  if (!intervention) {
    return NextResponse.json(
      { success: false, message: "Intervention introuvable." },
      { status: 404 },
    );
  }

  const clientName = `${intervention.contract.client.firstName} ${intervention.contract.client.lastName}`;
  const beforeCount = intervention.documents.filter(
    (d) => d.category === "BEFORE_PHOTO",
  ).length;
  const afterCount = intervention.documents.filter(
    (d) => d.category === "AFTER_PHOTO",
  ).length;

  const pdf = createSimplePdf([
    "FROID FRANCE CLIMATISATION",
    "Rapport d'intervention",
    "",
    `Client : ${clientName}`,
    `Adresse : ${intervention.contract.client.address || "-"} ${intervention.contract.client.postalCode || ""} ${intervention.contract.client.city || ""}`,
    `Equipement : ${intervention.contract.equipmentType}`,
    `Marque / modele : ${[intervention.contract.brand, intervention.contract.model].filter(Boolean).join(" - ") || "-"}`,
    `Date prevue : ${formatDate(intervention.plannedDate)}`,
    `Date realisee : ${formatDate(intervention.doneDate)}`,
    `Statut : ${intervention.status}`,
    "",
    "Compte-rendu :",
    intervention.notes || "Aucune note renseignee.",
    "",
    `Photos avant : ${beforeCount}`,
    `Photos apres : ${afterCount}`,
    "",
    `Rapport genere le : ${formatDate(new Date())}`,
  ]);

  await prisma.intervention.update({
    where: { id },
    data: { reportGeneratedAt: new Date() },
  });

  return new NextResponse(pdf, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="rapport-intervention-${id}.pdf"`,
    },
  });
}
