import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const updateClientSchema = z.object({
  firstName: z.string().min(1, "Le prenom est requis."),
  lastName: z.string().min(1, "Le nom est requis."),
  phone: z.string().optional().nullable(),
  email: z.string().email("Email invalide.").optional().or(z.literal("")),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  postalCode: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const client = await prisma.client.findUnique({
      where: { id },
    });

    if (!client) {
      return NextResponse.json(
        { success: false, message: "Client introuvable." },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      client,
    });
  } catch (error) {
    console.error("GET_CLIENT_ERROR", error);

    return NextResponse.json(
      { success: false, message: "Erreur serveur." },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = updateClientSchema.safeParse(body);

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

    const existingClient = await prisma.client.findUnique({
      where: { id },
    });

    if (!existingClient) {
      return NextResponse.json(
        { success: false, message: "Client introuvable." },
        { status: 404 },
      );
    }

    const client = await prisma.client.update({
      where: { id },
      data: {
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        phone: data.phone || null,
        email: data.email ? data.email.trim().toLowerCase() : null,
        address: data.address || null,
        city: data.city || null,
        postalCode: data.postalCode || null,
        notes: data.notes || null,
      },
    });

    return NextResponse.json({
      success: true,
      client,
    });
  } catch (error) {
    console.error("UPDATE_CLIENT_ERROR", error);

    return NextResponse.json(
      { success: false, message: "Erreur serveur." },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const existingClient = await prisma.client.findUnique({
      where: { id },
      include: {
        contracts: true,
      },
    });

    if (!existingClient) {
      return NextResponse.json(
        { success: false, message: "Client introuvable." },
        { status: 404 },
      );
    }

    if (existingClient.contracts.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Impossible de supprimer ce client car des contrats lui sont encore liés.",
        },
        { status: 409 },
      );
    }

    await prisma.client.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Client supprimé avec succès.",
    });
  } catch (error) {
    console.error("DELETE_CLIENT_ERROR", error);

    return NextResponse.json(
      {
        success: false,
        message: "Erreur serveur lors de la suppression du client.",
      },
      { status: 500 },
    );
  }
}
