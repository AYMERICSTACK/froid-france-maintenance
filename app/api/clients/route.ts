import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const createClientSchema = z.object({
  firstName: z.string().min(1, "Le prenom est requis."),
  lastName: z.string().min(1, "Le nom est requis."),
  phone: z.string().optional().nullable(),
  email: z.string().email("Email invalide.").optional().or(z.literal("")),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  postalCode: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export async function GET() {
  const clients = await prisma.client.findMany({
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(clients);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = createClientSchema.safeParse(body);

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

    const client = await prisma.client.create({
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
    console.error("CREATE_CLIENT_ERROR", error);

    return NextResponse.json(
      {
        success: false,
        message: "Erreur serveur.",
      },
      { status: 500 },
    );
  }
}
