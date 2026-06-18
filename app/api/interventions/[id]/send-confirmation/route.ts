import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { sendAppointmentConfirmation } from "@/lib/email";

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
      contract: {
        include: { client: true },
      },
    },
  });

  if (!intervention) {
    return NextResponse.json(
      { success: false, message: "Intervention introuvable." },
      { status: 404 },
    );
  }

  if (!intervention.plannedDate) {
    return NextResponse.json(
      {
        success: false,
        message:
          "Ajoutez une date et une heure avant d'envoyer la confirmation.",
      },
      { status: 400 },
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
  const subject = `Confirmation rendez-vous entretien - ${clientName}`;

  try {
    await sendAppointmentConfirmation({
      email: client.email,
      clientName,
      equipmentType: intervention.contract.equipmentType,
      brand: intervention.contract.brand,
      model: intervention.contract.model,
      plannedDate: intervention.plannedDate,
    });

    await prisma.$transaction([
      prisma.intervention.update({
        where: { id },
        data: { confirmationSentAt: new Date() },
      }),
      prisma.emailLog.create({
        data: {
          type: "APPOINTMENT_CONFIRMATION",
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
      message: "Confirmation envoyée au client.",
    });
  } catch (error) {
    await prisma.emailLog.create({
      data: {
        type: "APPOINTMENT_CONFIRMATION",
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
      { success: false, message: "Impossible d'envoyer la confirmation." },
      { status: 500 },
    );
  }
}
