import { NextResponse } from "next/server";
import { addDays, endOfDay, startOfDay } from "date-fns";
import { prisma } from "@/lib/prisma";
import { sendMaintenanceReminder } from "@/lib/email";
import { getCurrentUser } from "@/lib/auth";

export async function GET(request: Request) {
  const startedAt = new Date();

  try {
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    const isCronCall = !!cronSecret && authHeader === `Bearer ${cronSecret}`;

    const user = await getCurrentUser();
    const isDashboardUser = !!user;

    if (!isCronCall && !isDashboardUser) {
      return NextResponse.json(
        { success: false, message: "Non autorisé." },
        { status: 401 },
      );
    }

    const reminderEmail =
      process.env.REMINDER_TO_EMAIL || process.env.CONTACT_TO_EMAIL || "";

    if (!reminderEmail) {
      const message = "Aucune adresse email de rappel configurée.";

      await prisma.automationRun.create({
        data: {
          type: "AUTO_J30",
          source: isCronCall ? "CRON" : "MANUAL",
          status: "FAILED",
          message,
          startedAt,
          endedAt: new Date(),
        },
      });

      return NextResponse.json(
        {
          success: false,
          message,
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

        await prisma.$transaction([
          prisma.reminder.create({
            data: {
              contractId: contract.id,
              type: "AUTO_J30",
              scheduledFor: contract.nextMaintenanceDate,
              sentAt: new Date(),
              recipientEmail: reminderEmail,
              status: "SENT",
            },
          }),
          prisma.emailLog.create({
            data: {
              contractId: contract.id,
              type: "AUTO_J30",
              recipientEmail: reminderEmail,
              subject: `Rappel J-30 entretien - ${contract.client.firstName} ${contract.client.lastName}`,
              status: "SENT",
              sentAt: new Date(),
              userId: isDashboardUser ? user.id : null,
            },
          }),
        ]);

        sentCount += 1;
      } catch (error) {
        console.error("AUTO_REMINDER_SEND_ERROR", error);

        await prisma.$transaction([
          prisma.reminder.create({
            data: {
              contractId: contract.id,
              type: "AUTO_J30",
              scheduledFor: contract.nextMaintenanceDate,
              recipientEmail: reminderEmail,
              status: "FAILED",
              errorMessage:
                error instanceof Error ? error.message : "Erreur inconnue",
            },
          }),
          prisma.emailLog.create({
            data: {
              contractId: contract.id,
              type: "AUTO_J30",
              recipientEmail: reminderEmail,
              subject: `Rappel J-30 entretien - ${contract.client.firstName} ${contract.client.lastName}`,
              status: "FAILED",
              errorMessage:
                error instanceof Error ? error.message : "Erreur inconnue",
              userId: isDashboardUser ? user.id : null,
            },
          }),
        ]);

        failedCount += 1;
      }
    }

    const message = `${sentCount} rappel(s) envoyé(s), ${skippedCount} ignoré(s), ${failedCount} échec(s).`;

    await prisma.automationRun.create({
      data: {
        type: "AUTO_J30",
        source: isCronCall ? "CRON" : "MANUAL",
        status: failedCount > 0 ? "PARTIAL" : "SUCCESS",
        foundCount: contracts.length,
        sentCount,
        skippedCount,
        failedCount,
        message,
        startedAt,
        endedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message,
      stats: {
        found: contracts.length,
        sent: sentCount,
        skipped: skippedCount,
        failed: failedCount,
      },
    });
  } catch (error) {
    console.error("RUN_AUTO_REMINDERS_ERROR", error);

    try {
      await prisma.automationRun.create({
        data: {
          type: "AUTO_J30",
          source: "UNKNOWN",
          status: "FAILED",
          failedCount: 1,
          message: error instanceof Error ? error.message : "Erreur serveur.",
          startedAt,
          endedAt: new Date(),
        },
      });
    } catch (logError) {
      console.error("AUTOMATION_RUN_LOG_ERROR", logError);
    }

    return NextResponse.json(
      { success: false, message: "Erreur serveur." },
      { status: 500 },
    );
  }
}
