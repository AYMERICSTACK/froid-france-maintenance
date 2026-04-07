import { prisma } from "@/lib/prisma";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    await prisma.intervention.delete({
      where: { id },
    });

    return Response.json({ success: true });
  } catch {
    return new Response("Erreur", { status: 500 });
  }
}
