import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const createContractSchema = z.object({
  clientId: z.string().min(1, "Le client est requis."),
  equipmentType: z.string().min(1, "Le type d'equipement est requis."),
  brand: z.string().optional().nullable(),
  model: z.string().optional().nullable(),
  subscriptionDate: z.string().optional().nullable(),
  lastMaintenanceDate: z.string().optional().nullable(),
  nextMaintenanceDate: z
    .string()
    .min(1, "La date du prochain entretien est requise."),
  frequencyMonths: z.coerce.number().int().positive().default(12),
  notes: z.string().optional().nullable(),
});

export async function GET() {
  const contracts = await prisma.contract.findMany({
    include: {
      client: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return NextResponse.json(contracts);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = createContractSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Donnees invalides.",
          errors: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    const data = parsed.data;

    const contract = await prisma.contract.create({
      data: {
        clientId: data.clientId,
        equipmentType: data.equipmentType.trim(),
        brand: data.brand || null,
        model: data.model || null,
        subscriptionDate: data.subscriptionDate
          ? new Date(data.subscriptionDate)
          : null,
        lastMaintenanceDate: data.lastMaintenanceDate
          ? new Date(data.lastMaintenanceDate)
          : null,
        nextMaintenanceDate: new Date(data.nextMaintenanceDate),
        frequencyMonths: data.frequencyMonths || 12,
        notes: data.notes || null,
      },
      include: {
        client: true,
      },
    });

    return NextResponse.json({
      success: true,
      contract,
    });
  } catch (error) {
    console.error("CREATE_CONTRACT_ERROR", error);

    return NextResponse.json(
      {
        success: false,
        message: "Erreur serveur.",
      },
      { status: 500 },
    );
  }
}
