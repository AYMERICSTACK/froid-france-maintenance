import { NextResponse } from "next/server";
import { addDays, endOfDay, startOfDay } from "date-fns";
import { prisma } from "@/lib/prisma";
import { sendMaintenanceReminder } from "@/lib/email";

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { success: false, message: "Non autorisé." },
        { status: 401 },
      );
    }

    const reminderEmail =
      process.env.REMINDER_TO_EMAIL || process.env.CONTACT_TO_EMAIL || "";

    if (!reminderEmail) {
      return NextResponse.json(
        {
          success: false,
          message: "Aucune adresse email de rappel configurée.",
        },
        { status: 500 },
      );
    }

    const targetDate = addDays(new Date(), 30);
    const targetStart = startOfDay(targetDate);
    const targetEnd = endOfDay(targetDate);

    const contracts = await prisma.contract.findMany({
      where: {
        status: "ACTIVE",
        nextMaintenanceDate: {
          gte: targetStart,
          lte: targetEnd,
        },
      },
      include: {
        client: true,
        reminders: true,
      },
      orderBy: {
        nextMaintenanceDate: "asc",
      },
    });

    let sentCount = 0;
    let skippedCount = 0;
    let failedCount = 0;

    for (const contract of contracts) {
      const alreadySent = contract.reminders.some(
        (reminder) =>
          reminder.type === "AUTO_J30" &&
          reminder.status === "SENT" &&
          new Date(reminder.scheduledFor).toDateString() ===
            new Date(contract.nextMaintenanceDate).toDateString(),
      );

      if (alreadySent) {
        skippedCount += 1;
        continue;
      }

      try {
        await sendMaintenanceReminder({
          email: reminderEmail,
          clientName: `${contract.client.firstName} ${contract.client.lastName}`,
          equipmentType: contract.equipmentType,
          brand: contract.brand,
          model: contract.model,
          date: contract.nextMaintenanceDate,
        });

        await prisma.reminder.create({
          data: {
            contractId: contract.id,
            type: "AUTO_J30",
            scheduledFor: contract.nextMaintenanceDate,
            sentAt: new Date(),
            recipientEmail: reminderEmail,
            status: "SENT",
          },
        });

        sentCount += 1;
      } catch (error) {
        console.error("AUTO_REMINDER_SEND_ERROR", error);

        await prisma.reminder.create({
          data: {
            contractId: contract.id,
            type: "AUTO_J30",
            scheduledFor: contract.nextMaintenanceDate,
            recipientEmail: reminderEmail,
            status: "FAILED",
            errorMessage:
              error instanceof Error ? error.message : "Erreur inconnue",
          },
        });

        failedCount += 1;
      }
    }

    return NextResponse.json({
      success: true,
      stats: {
        found: contracts.length,
        sent: sentCount,
        skipped: skippedCount,
        failed: failedCount,
      },
    });
  } catch (error) {
    console.error("RUN_AUTO_REMINDERS_ERROR", error);

    return NextResponse.json(
      { success: false, message: "Erreur serveur." },
      { status: 500 },
    );
  }
}
