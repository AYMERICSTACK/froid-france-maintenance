"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, Upload } from "lucide-react";

type PhotoDocument = {
  id: string;
  name: string;
  fileUrl: string;
  category: string;
  createdAt: Date | string;
};

export default function InterventionPhotosSection({
  interventionId,
  photos,
}: {
  interventionId: string;
  photos: PhotoDocument[];
}) {
  const router = useRouter();
  const [isUploading, setIsUploading] = useState<string | null>(null);

  async function uploadPhoto(
    file: File,
    category: "BEFORE_PHOTO" | "AFTER_PHOTO",
  ) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("interventionId", interventionId);
    formData.append("category", category);

    setIsUploading(category);

    try {
      const response = await fetch("/api/documents/upload", {
        method: "POST",
        body: formData,
      });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        alert(data?.message || "Impossible d'uploader la photo.");
        return;
      }

      router.refresh();
    } finally {
      setIsUploading(null);
    }
  }

  const beforePhotos = photos.filter(
    (photo) => photo.category === "BEFORE_PHOTO",
  );
  const afterPhotos = photos.filter(
    (photo) => photo.category === "AFTER_PHOTO",
  );

  return (
    <section className="rounded-[32px] border border-white/70 bg-white/90 p-6 shadow-sm">
      <div className="mb-6">
        <p className="text-sm font-semibold text-[#0b79d0]">Terrain</p>
        <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
          Photos avant / après
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          Ajoutez des photos terrain pour documenter l’intervention.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <PhotoColumn
          title="Avant intervention"
          category="BEFORE_PHOTO"
          photos={beforePhotos}
          isUploading={isUploading === "BEFORE_PHOTO"}
          onUpload={uploadPhoto}
        />
        <PhotoColumn
          title="Après intervention"
          category="AFTER_PHOTO"
          photos={afterPhotos}
          isUploading={isUploading === "AFTER_PHOTO"}
          onUpload={uploadPhoto}
        />
      </div>
    </section>
  );
}

function PhotoColumn({
  title,
  category,
  photos,
  isUploading,
  onUpload,
}: {
  title: string;
  category: "BEFORE_PHOTO" | "AFTER_PHOTO";
  photos: PhotoDocument[];
  isUploading: boolean;
  onUpload: (file: File, category: "BEFORE_PHOTO" | "AFTER_PHOTO") => void;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-slate-50/70 p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Camera className="h-4 w-4 text-slate-400" />
          <h3 className="font-bold text-slate-900">{title}</h3>
        </div>

        <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-white px-3 py-2 text-xs font-semibold text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-100">
          <Upload className="h-3.5 w-3.5" />
          {isUploading ? "Upload..." : "Ajouter"}
          <input
            type="file"
            accept="image/jpeg,image/png"
            className="hidden"
            disabled={isUploading}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              onUpload(file, category);
              event.target.value = "";
            }}
          />
        </label>
      </div>

      {photos.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-500">
          Aucune photo
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {photos.map((photo) => (
            <a
              key={photo.id}
              href={photo.fileUrl}
              target="_blank"
              rel="noreferrer"
              className="group relative aspect-square overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200"
            >
              <Image
                src={photo.fileUrl}
                alt={photo.name}
                fill
                sizes="160px"
                className="object-cover transition group-hover:scale-105"
                unoptimized
              />
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
