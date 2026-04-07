import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  contractId: z.string().min(1),
  plannedDate: z.string().min(1),
  notes: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: "Donnees invalides." },
        { status: 400 },
      );
    }

    const { contractId, plannedDate, notes } = parsed.data;

    const contract = await prisma.contract.findUnique({
      where: { id: contractId },
    });

    if (!contract) {
      return NextResponse.json(
        { success: false, message: "Contrat introuvable." },
        { status: 404 },
      );
    }

    const parsedPlannedDate = new Date(plannedDate);

    if (Number.isNaN(parsedPlannedDate.getTime())) {
      return NextResponse.json(
        { success: false, message: "Date d’intervention invalide." },
        { status: 400 },
      );
    }

    const intervention = await prisma.intervention.create({
      data: {
        contractId,
        plannedDate: parsedPlannedDate,
        doneDate: null,
        status: "PLANNED",
        notes: notes || null,
      },
    });

    return NextResponse.json({
      success: true,
      intervention,
    });
  } catch (error) {
    console.error("CREATE_INTERVENTION_ERROR", error);

    return NextResponse.json(
      { success: false, message: "Erreur serveur." },
      { status: 500 },
    );
  }
}
