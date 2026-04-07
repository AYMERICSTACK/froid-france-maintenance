import { sendMaintenanceReminder } from "@/lib/email";

export async function GET() {
  await sendMaintenanceReminder({
    email: process.env.REMINDER_TO_EMAIL!,
    clientName: "Client Test",
    equipmentType: "Climatisation",
    date: new Date(),
  });

  return Response.json({ ok: true });
}
