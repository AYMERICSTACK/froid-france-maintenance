import { prisma } from "@/lib/prisma";

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } },
) {
  try {
    await prisma.intervention.delete({
      where: { id: params.id },
    });

    return Response.json({ success: true });
  } catch {
    return new Response("Erreur", { status: 500 });
  }
}
