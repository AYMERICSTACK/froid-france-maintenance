import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendMaintenanceReminder } from "@/lib/email";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const contract = await prisma.contract.findUnique({
      where: { id },
      include: {
        client: true,
      },
    });

    if (!contract) {
      return NextResponse.json(
        { success: false, message: "Contrat introuvable." },
        { status: 404 },
      );
    }

    const to =
      process.env.REMINDER_TO_EMAIL || process.env.CONTACT_TO_EMAIL || "";

    if (!to) {
      return NextResponse.json(
        {
          success: false,
          message: "Aucune adresse email de rappel configurée.",
        },
        { status: 500 },
      );
    }

    await sendMaintenanceReminder({
      email: to,
      clientName: `${contract.client.firstName} ${contract.client.lastName}`,
      equipmentType: contract.equipmentType,
      brand: contract.brand,
      model: contract.model,
      date: contract.nextMaintenanceDate,
    });

    await prisma.reminder.create({
      data: {
        contractId: contract.id,
        type: "MANUAL",
        scheduledFor: new Date(),
        sentAt: new Date(),
        recipientEmail: to,
        status: "SENT",
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("SEND_REMINDER_ERROR", error);

    return NextResponse.json(
      { success: false, message: "Erreur lors de l'envoi du rappel." },
      { status: 500 },
    );
  }
}
