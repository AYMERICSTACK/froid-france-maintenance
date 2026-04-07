import { sendMaintenanceReminder } from "@/lib/email";

export async function GET() {
  await sendMaintenanceReminder({
    email: "tonmail@test.com",
    name: "Client Test",
    date: new Date(),
  });

  return Response.json({ ok: true });
}
