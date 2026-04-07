import { NextResponse } from "next/server";
import { unlink } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/prisma";
import { supabaseAdmin, SUPABASE_STORAGE_BUCKET } from "@/lib/supabase-admin";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const existingDocument = await prisma.document.findUnique({
      where: { id },
    });

    if (!existingDocument) {
      return NextResponse.json(
        { success: false, message: "Document introuvable." },
        { status: 404 },
      );
    }

    await prisma.document.delete({
      where: { id },
    });

    if (existingDocument.storagePath) {
      const { error: removeError } = await supabaseAdmin.storage
        .from(SUPABASE_STORAGE_BUCKET)
        .remove([existingDocument.storagePath]);

      if (removeError) {
        console.warn("DELETE_SUPABASE_FILE_WARNING", removeError);
      }
    } else if (existingDocument.fileUrl.startsWith("/uploads/")) {
      const fileName = existingDocument.fileUrl.replace("/uploads/", "");
      const filePath = path.join(process.cwd(), "public", "uploads", fileName);

      try {
        await unlink(filePath);
      } catch (error) {
        console.warn("DELETE_LOCAL_DOCUMENT_FILE_WARNING", error);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Document supprimé avec succès.",
    });
  } catch (error) {
    console.error("DELETE_DOCUMENT_ERROR", error);

    return NextResponse.json(
      { success: false, message: "Erreur serveur lors de la suppression." },
      { status: 500 },
    );
  }
}
