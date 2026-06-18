import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { supabaseAdmin, SUPABASE_STORAGE_BUCKET } from "@/lib/supabase-admin";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const ALLOWED_TYPES = ["application/pdf", "image/jpeg", "image/png"];
const DOCUMENT_CATEGORIES = [
  "GENERAL",
  "BEFORE_PHOTO",
  "AFTER_PHOTO",
  "REPORT",
] as const;

function sanitizeFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9.-_]/g, "_");
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    const file = formData.get("file");
    const clientId = formData.get("clientId");
    const contractId = formData.get("contractId");
    const interventionId = formData.get("interventionId");
    const category = formData.get("category") || "GENERAL";

    if (!(file instanceof File)) {
      return NextResponse.json(
        { success: false, message: "Fichier invalide." },
        { status: 400 },
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, message: "Fichier trop volumineux (max 5MB)." },
        { status: 400 },
      );
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          success: false,
          message: "Type de fichier non autorisé (PDF, JPG, PNG uniquement).",
        },
        { status: 400 },
      );
    }

    if (!clientId && !contractId && !interventionId) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Le document doit être lié à un client, un contrat ou une intervention.",
        },
        { status: 400 },
      );
    }

    if (clientId && typeof clientId !== "string") {
      return NextResponse.json(
        { success: false, message: "clientId invalide." },
        { status: 400 },
      );
    }

    if (contractId && typeof contractId !== "string") {
      return NextResponse.json(
        { success: false, message: "contractId invalide." },
        { status: 400 },
      );
    }

    if (interventionId && typeof interventionId !== "string") {
      return NextResponse.json(
        { success: false, message: "interventionId invalide." },
        { status: 400 },
      );
    }

    if (
      typeof category !== "string" ||
      !DOCUMENT_CATEGORIES.includes(category as any)
    ) {
      return NextResponse.json(
        { success: false, message: "Catégorie de document invalide." },
        { status: 400 },
      );
    }

    if (clientId) {
      const client = await prisma.client.findUnique({
        where: { id: clientId },
      });

      if (!client) {
        return NextResponse.json(
          { success: false, message: "Client introuvable." },
          { status: 404 },
        );
      }
    }

    if (contractId) {
      const contract = await prisma.contract.findUnique({
        where: { id: contractId },
      });

      if (!contract) {
        return NextResponse.json(
          { success: false, message: "Contrat introuvable." },
          { status: 404 },
        );
      }
    }

    if (interventionId) {
      const intervention = await prisma.intervention.findUnique({
        where: { id: interventionId },
      });

      if (!intervention) {
        return NextResponse.json(
          { success: false, message: "Intervention introuvable." },
          { status: 404 },
        );
      }
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const safeName = sanitizeFileName(file.name);
    const storagePath = `${new Date().getFullYear()}/${Date.now()}-${safeName}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from(SUPABASE_STORAGE_BUCKET)
      .upload(storagePath, buffer, {
        contentType: file.type || undefined,
        upsert: false,
      });

    if (uploadError) {
      console.error("SUPABASE_UPLOAD_ERROR", uploadError);

      return NextResponse.json(
        { success: false, message: "Erreur lors de l'upload du fichier." },
        { status: 500 },
      );
    }

    const { data: publicUrlData } = supabaseAdmin.storage
      .from(SUPABASE_STORAGE_BUCKET)
      .getPublicUrl(storagePath);

    const document = await prisma.document.create({
      data: {
        name: file.name,
        fileUrl: publicUrlData.publicUrl,
        storagePath,
        mimeType: file.type || null,
        size: file.size || null,
        clientId: clientId || null,
        contractId: contractId || null,
        interventionId: interventionId || null,
        category: category as any,
      },
    });

    return NextResponse.json({
      success: true,
      document,
    });
  } catch (error) {
    console.error("UPLOAD_DOCUMENT_ERROR", error);

    return NextResponse.json(
      { success: false, message: "Erreur serveur lors de l'upload." },
      { status: 500 },
    );
  }
}
