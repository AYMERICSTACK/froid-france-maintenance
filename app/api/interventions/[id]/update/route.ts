import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const formData = await req.formData();

    const plannedDate = formData.get("plannedDate") as string | null;
    const time = formData.get("time") as string | null;
    const status = formData.get("status") as string | null;
    const notes = formData.get("notes") as string | null;
    const checklist = formData.getAll("checklist") as string[];
    const clientName = formData.get("clientName") as string | null;

    let finalDate: Date | null = null;

    if (plannedDate) {
      finalDate = new Date(plannedDate);

      if (time) {
        const [hours, minutes] = time.split(":");
        finalDate.setHours(Number(hours));
        finalDate.setMinutes(Number(minutes));
        finalDate.setSeconds(0);
        finalDate.setMilliseconds(0);
      }
    }

    const autoChecklistNote =
      checklist.length > 0
        ? `Intervention réalisée :\n- ${checklist.join("\n- ")}`
        : "";

    const validationNote = clientName?.trim()
      ? `\n\nValidé par : ${clientName.trim()}`
      : "";

    const finalNotes =
      notes?.trim() ||
      (autoChecklistNote ? `${autoChecklistNote}${validationNote}` : "");

    await prisma.intervention.update({
      where: { id },
      data: {
        plannedDate: finalDate,
        status: status as any,
        notes: finalNotes || null,
        doneDate: status === "DONE" ? new Date() : null,
      },
    });

    return NextResponse.redirect(new URL("/dashboard/contracts", req.url));
  } catch (error) {
    console.error("Erreur update intervention:", error);
    return new NextResponse("Erreur serveur lors de la mise à jour", {
      status: 500,
    });
  }
}
