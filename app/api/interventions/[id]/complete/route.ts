import { NextResponse } from "next/server";
import { addMonths } from "date-fns";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const intervention = await prisma.intervention.findUnique({
      where: { id },
      include: {
        contract: true,
      },
    });

    if (!intervention) {
      return NextResponse.json(
        { success: false, message: "Intervention introuvable." },
        { status: 404 },
      );
    }

    if (intervention.status === "DONE" && intervention.doneDate) {
      return NextResponse.json({
        success: true,
        message: "Intervention déjà marquée comme faite.",
      });
    }

    const effectiveDoneDate = intervention.plannedDate ?? new Date();
    const nextDate = addMonths(
      effectiveDoneDate,
      intervention.contract.frequencyMonths || 12,
    );

    await prisma.intervention.update({
      where: { id },
      data: {
        doneDate: effectiveDoneDate,
        status: "DONE",
      },
    });

    await prisma.contract.update({
      where: { id: intervention.contractId },
      data: {
        lastMaintenanceDate: effectiveDoneDate,
        nextMaintenanceDate: nextDate,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Intervention marquée comme faite.",
    });
  } catch (error) {
    console.error("COMPLETE_INTERVENTION_ERROR", error);

    return NextResponse.json(
      { success: false, message: "Erreur serveur." },
      { status: 500 },
    );
  }
}
