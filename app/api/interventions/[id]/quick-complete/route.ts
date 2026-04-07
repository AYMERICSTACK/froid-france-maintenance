import { prisma } from "@/lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    await prisma.intervention.update({
      where: { id },
      data: {
        status: "DONE",
        doneDate: new Date(),
        notes: "Intervention réalisée (validation rapide)",
      },
    });

    return Response.json({ success: true });
  } catch {
    return new Response("Erreur", { status: 500 });
  }
}
