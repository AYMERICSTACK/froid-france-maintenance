import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { createSimplePdf } from "@/lib/pdf";
import { sendInterventionReportEmail } from "@/lib/email";

export async function POST(
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

  const client = intervention.contract.client;

  if (!client.email) {
    return NextResponse.json(
      {
        success: false,
        message: "Le client n'a pas d'adresse email renseignée.",
      },
      { status: 400 },
    );
  }

  const clientName = `${client.firstName} ${client.lastName}`;
  const subject = `Rapport d’intervention - ${clientName}`;

  const pdf = createSimplePdf([
    "FROID FRANCE CLIMATISATION",
    "Rapport d'intervention",
    "",
    `Client : ${clientName}`,
    `Equipement : ${intervention.contract.equipmentType}`,
    `Statut : ${intervention.status}`,
    "",
    "Compte-rendu :",
    intervention.notes || "Aucune note renseignee.",
  ]);

  try {
    await sendInterventionReportEmail({
      email: client.email,
      clientName,
      equipmentType: intervention.contract.equipmentType,
      plannedDate: intervention.plannedDate,
      pdf,
    });

    await prisma.$transaction([
      prisma.intervention.update({
        where: { id },
        data: { reportGeneratedAt: new Date() },
      }),
      prisma.emailLog.create({
        data: {
          type: "INTERVENTION_REPORT",
          recipientEmail: client.email,
          subject,
          status: "SENT",
          sentAt: new Date(),
          contractId: intervention.contractId,
          interventionId: intervention.id,
          userId: user.id,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: "Rapport envoyé au client.",
    });
  } catch (error) {
    await prisma.emailLog.create({
      data: {
        type: "INTERVENTION_REPORT",
        recipientEmail: client.email,
        subject,
        status: "FAILED",
        errorMessage:
          error instanceof Error ? error.message : "Erreur inconnue",
        contractId: intervention.contractId,
        interventionId: intervention.id,
        userId: user.id,
      },
    });

    return NextResponse.json(
      { success: false, message: "Impossible d'envoyer le rapport." },
      { status: 500 },
    );
  }
}
