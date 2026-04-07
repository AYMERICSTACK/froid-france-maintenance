import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type ContractStatus = "ACTIVE" | "INACTIVE" | "EXPIRED";

function parseOptionalDate(value: unknown) {
  if (!value || typeof value !== "string") return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return date;
}

function isValidStatus(value: unknown): value is ContractStatus {
  return value === "ACTIVE" || value === "INACTIVE" || value === "EXPIRED";
}

function addMonths(date: Date, months: number) {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const body = await request.json();

    const {
      equipmentType,
      brand,
      model,
      subscriptionDate,
      lastMaintenanceDate,
      nextMaintenanceDate,
      frequencyMonths,
      status,
      notes,
    } = body;

    if (!equipmentType || typeof equipmentType !== "string") {
      return NextResponse.json(
        { error: "Le type d’équipement est obligatoire." },
        { status: 400 },
      );
    }

    if (
      typeof frequencyMonths !== "number" ||
      Number.isNaN(frequencyMonths) ||
      frequencyMonths < 1
    ) {
      return NextResponse.json(
        { error: "La fréquence doit être un nombre supérieur ou égal à 1." },
        { status: 400 },
      );
    }

    if (!isValidStatus(status)) {
      return NextResponse.json(
        { error: "Le statut du contrat est invalide." },
        { status: 400 },
      );
    }

    const existingContract = await prisma.contract.findUnique({
      where: { id },
    });

    if (!existingContract) {
      return NextResponse.json(
        { error: "Contrat introuvable." },
        { status: 404 },
      );
    }

    const parsedSubscriptionDate = parseOptionalDate(subscriptionDate);
    const parsedLastMaintenanceDate = parseOptionalDate(lastMaintenanceDate);

    let parsedNextMaintenanceDate: Date | null = null;

    if (parsedLastMaintenanceDate) {
      parsedNextMaintenanceDate = addMonths(
        parsedLastMaintenanceDate,
        frequencyMonths,
      );
    } else {
      if (!nextMaintenanceDate || typeof nextMaintenanceDate !== "string") {
        return NextResponse.json(
          { error: "La date du prochain entretien est obligatoire." },
          { status: 400 },
        );
      }

      parsedNextMaintenanceDate = new Date(nextMaintenanceDate);

      if (Number.isNaN(parsedNextMaintenanceDate.getTime())) {
        return NextResponse.json(
          { error: "La date du prochain entretien est invalide." },
          { status: 400 },
        );
      }
    }

    const updatedContract = await prisma.contract.update({
      where: { id },
      data: {
        equipmentType: equipmentType.trim(),
        brand: brand?.trim() || null,
        model: model?.trim() || null,
        subscriptionDate: parsedSubscriptionDate,
        lastMaintenanceDate: parsedLastMaintenanceDate,
        nextMaintenanceDate: parsedNextMaintenanceDate,
        frequencyMonths,
        status,
        notes: notes?.trim() || null,
      },
    });

    return NextResponse.json(updatedContract);
  } catch (error) {
    console.error("PATCH /api/contracts/[id] error:", error);

    return NextResponse.json(
      { error: "Erreur serveur lors de la modification du contrat." },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;

    const existingContract = await prisma.contract.findUnique({
      where: { id },
    });

    if (!existingContract) {
      return NextResponse.json(
        { error: "Contrat introuvable." },
        { status: 404 },
      );
    }

    await prisma.contract.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/contracts/[id] error:", error);

    return NextResponse.json(
      { error: "Erreur serveur lors de la suppression du contrat." },
      { status: 500 },
    );
  }
}
