"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FileText,
  Image as ImageIcon,
  Paperclip,
  Upload,
  Trash2,
  ExternalLink,
  X,
} from "lucide-react";

type DocumentItem = {
  id: string;
  name: string;
  fileUrl: string;
  mimeType: string | null;
  size: number | null;
  createdAt: Date | string;
};

type DocumentsSectionProps = {
  title: string;
  subtitle: string;
  clientId?: string;
  contractId?: string;
  documents: DocumentItem[];
};

function formatFileSize(size: number | null) {
  if (!size || size <= 0) return "-";
  if (size < 1024) return `${size} o`;
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} Ko`;
  return `${(size / (1024 * 1024)).toFixed(1)} Mo`;
}

function getDocumentLabel(mimeType: string | null) {
  if (!mimeType) return "Document";
  if (mimeType.includes("pdf")) return "PDF";
  if (mimeType.includes("image")) return "Image";
  return "Document";
}

function isImageFile(mimeType: string | null) {
  return !!mimeType && mimeType.startsWith("image/");
}

function isPdfFile(mimeType: string | null) {
  return mimeType === "application/pdf";
}

function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString("fr-FR");
}

export default function DocumentsSection({
  title,
  subtitle,
  clientId,
  contractId,
  documents,
}: DocumentsSectionProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [isUploading, setIsUploading] = useState(false);
  const [uploadCount, setUploadCount] = useState(0);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<DocumentItem | null>(null);

  async function uploadSingleFile(file: File) {
    const formData = new FormData();
    formData.append("file", file);

    if (clientId) {
      formData.append("clientId", clientId);
    }

    if (contractId) {
      formData.append("contractId", contractId);
    }

    const response = await fetch("/api/documents/upload", {
      method: "POST",
      body: formData,
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      console.error(data);
      throw new Error(data?.message || `Impossible d'uploader ${file.name}.`);
    }

    return data;
  }

  async function handleUpload(files: File[]) {
    if (files.length === 0) return;

    setIsUploading(true);
    setUploadCount(files.length);

    const errors: string[] = [];

    try {
      for (const file of files) {
        try {
          await uploadSingleFile(file);
        } catch (error) {
          const message =
            error instanceof Error
              ? error.message
              : `Erreur lors de l'upload de ${file.name}.`;

          errors.push(`${file.name} : ${message}`);
        }
      }

      if (errors.length > 0) {
        alert(errors.join("\n"));
      }

      router.refresh();
    } catch {
      alert("Une erreur est survenue lors de l'upload.");
    } finally {
      setIsUploading(false);
      setUploadCount(0);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  async function handleDelete(documentId: string) {
    const confirmed = window.confirm(
      "Voulez-vous vraiment supprimer ce document ?",
    );

    if (!confirmed) return;

    setDeletingId(documentId);

    try {
      const response = await fetch(`/api/documents/${documentId}`, {
        method: "DELETE",
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        alert(data?.message || "Impossible de supprimer le document.");
        setDeletingId(null);
        return;
      }

      router.refresh();
    } catch {
      alert("Une erreur est survenue lors de la suppression.");
      setDeletingId(null);
    }
  }

  return (
    <>
      <section className="rounded-[32px] border border-white/70 bg-white/90 p-6 shadow-sm">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-[#0b79d0]">{subtitle}</p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
              {title}
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Centralisez les PDF, photos et justificatifs au même endroit.
            </p>
          </div>

          <label className="inline-flex cursor-pointer items-center gap-2 rounded-2xl bg-[#0b79d0] px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:-translate-y-0.5 hover:bg-[#0a6dbd] hover:shadow-lg">
            <Upload className="h-4 w-4" />
            {isUploading
              ? `Upload en cours (${uploadCount})...`
              : "Ajouter des documents"}

            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,image/jpeg,image/png"
              className="hidden"
              onChange={(e) => {
                const files = Array.from(e.target.files || []);
                if (files.length === 0) return;
                void handleUpload(files);
              }}
              disabled={isUploading}
            />
          </label>
        </div>

        <div
          onDragOver={(e) => {
            e.preventDefault();
            if (!isUploading) {
              setIsDragging(true);
            }
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            setIsDragging(false);
          }}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);

            if (isUploading) return;

            const files = Array.from(e.dataTransfer.files || []);
            if (files.length === 0) return;

            void handleUpload(files);
          }}
          onClick={() => {
            if (!isUploading) {
              fileInputRef.current?.click();
            }
          }}
          className={`mb-6 rounded-3xl border-2 border-dashed p-6 text-center transition ${
            isDragging
              ? "border-[#0b79d0] bg-blue-50"
              : "border-slate-200 bg-slate-50/80"
          } ${isUploading ? "cursor-not-allowed opacity-70" : "cursor-pointer hover:bg-slate-50"}`}
        >
          <div className="mx-auto flex max-w-md flex-col items-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
              <Upload className="h-5 w-5 text-slate-600" />
            </div>

            <p className="mt-4 font-semibold text-slate-900">
              {isUploading
                ? "Upload en cours..."
                : "Glissez-déposez vos fichiers ici"}
            </p>

            <p className="mt-2 text-sm text-slate-500">
              ou cliquez pour sélectionner plusieurs documents
            </p>

            <p className="mt-2 text-xs text-slate-400">
              Formats autorisés : PDF, JPG, PNG • 5 Mo maximum par fichier
            </p>
          </div>
        </div>

        {documents.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center">
            <p className="text-sm font-medium text-slate-900">
              Aucun document disponible pour le moment
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Ajoute un PDF ou une image pour démarrer ce dossier.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div
                  className="cursor-pointer"
                  onClick={() => {
                    if (isImageFile(doc.mimeType)) {
                      setPreviewDoc(doc);
                    } else {
                      window.open(doc.fileUrl, "_blank");
                    }
                  }}
                >
                  <div className="relative flex h-44 items-center justify-center overflow-hidden bg-slate-100">
                    {isImageFile(doc.mimeType) ? (
                      <Image
                        src={doc.fileUrl}
                        alt={doc.name}
                        fill
                        className="object-cover"
                      />
                    ) : isPdfFile(doc.mimeType) ? (
                      <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-red-50 to-white">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-red-100">
                          <FileText className="h-7 w-7 text-red-500" />
                        </div>
                        <span className="mt-3 text-sm font-semibold text-slate-700">
                          Aperçu PDF
                        </span>
                      </div>
                    ) : (
                      <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-slate-100 to-white">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
                          <Paperclip className="h-7 w-7 text-slate-500" />
                        </div>
                        <span className="mt-3 text-sm font-semibold text-slate-700">
                          Document
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-4">
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <button
                        type="button"
                        onClick={() => {
                          if (isImageFile(doc.mimeType)) {
                            setPreviewDoc(doc);
                          } else {
                            window.open(doc.fileUrl, "_blank");
                          }
                        }}
                        className="block max-w-full truncate text-left font-semibold text-slate-900 transition hover:text-[#0b79d0]"
                        title={doc.name}
                      >
                        {doc.name}
                      </button>

                      <p className="mt-1 text-sm text-slate-500">
                        {formatDate(doc.createdAt)}
                      </p>
                    </div>

                    <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                      {getDocumentLabel(doc.mimeType)}
                    </span>
                  </div>

                  <div className="mb-4 rounded-2xl bg-slate-50 px-3 py-3 text-sm text-slate-600">
                    <p>Taille : {formatFileSize(doc.size)}</p>

                    <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                      {doc.mimeType?.includes("pdf") && (
                        <span className="inline-flex items-center gap-1">
                          <FileText className="h-3.5 w-3.5" />
                          PDF
                        </span>
                      )}

                      {doc.mimeType?.includes("image") && (
                        <span className="inline-flex items-center gap-1">
                          <ImageIcon className="h-3.5 w-3.5" />
                          Image
                        </span>
                      )}

                      {!doc.mimeType && (
                        <span className="inline-flex items-center gap-1">
                          <Paperclip className="h-3.5 w-3.5" />
                          Document
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <a
                      href={doc.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Ouvrir
                    </a>

                    <button
                      type="button"
                      onClick={() => void handleDelete(doc.id)}
                      disabled={deletingId === doc.id}
                      className="inline-flex items-center justify-center rounded-2xl bg-red-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {deletingId === doc.id ? (
                        "..."
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {previewDoc && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setPreviewDoc(null)}
        >
          <div
            className="relative max-h-[90vh] max-w-[90vw]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setPreviewDoc(null)}
              className="absolute right-3 top-3 z-10 inline-flex items-center justify-center rounded-full bg-white/95 p-2 text-slate-800 shadow"
            >
              <X className="h-4 w-4" />
            </button>

            <img
              src={previewDoc.fileUrl}
              alt={previewDoc.name}
              className="max-h-[90vh] max-w-[90vw] rounded-2xl object-contain"
            />

            <p className="mt-3 text-center text-sm font-medium text-white">
              {previewDoc.name}
            </p>
          </div>
        </div>
      )}
    </>
  );
}
