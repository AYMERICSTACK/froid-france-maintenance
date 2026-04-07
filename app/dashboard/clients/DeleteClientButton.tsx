"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Lock } from "lucide-react";

type DeleteClientButtonProps = {
  clientId: string;
  clientName: string;
  contractsCount?: number;
};

export default function DeleteClientButton({
  clientId,
  clientName,
  contractsCount = 0,
}: DeleteClientButtonProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const isBlocked = contractsCount > 0;

  async function handleDelete() {
    if (isBlocked) return;

    const confirmed = window.confirm(
      `Voulez-vous vraiment supprimer ${clientName} ?`,
    );

    if (!confirmed) return;

    setIsDeleting(true);

    try {
      const response = await fetch(`/api/clients/${clientId}`, {
        method: "DELETE",
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        alert(data?.message || "Impossible de supprimer le client.");
        setIsDeleting(false);
        return;
      }

      router.refresh();
    } catch {
      alert("Une erreur est survenue lors de la suppression.");
      setIsDeleting(false);
    }
  }

  return (
    <div className="flex w-full flex-col gap-1">
      <button
        type="button"
        onClick={handleDelete}
        disabled={isDeleting || isBlocked}
        title={
          isBlocked
            ? "Suppression impossible : ce client possède encore des contrats."
            : "Supprimer le client"
        }
        className={`inline-flex w-full items-center justify-center rounded-xl px-3 py-2.5 text-sm font-medium transition ${
          isBlocked
            ? "cursor-not-allowed border border-slate-200 bg-slate-100 text-slate-400"
            : "border border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
        } disabled:opacity-70 sm:w-auto`}
      >
        {isBlocked ? (
          <Lock className="mr-1.5 h-4 w-4" />
        ) : (
          <Trash2 className="mr-1.5 h-4 w-4" />
        )}

        {isDeleting
          ? "Suppression..."
          : isBlocked
            ? "Suppression bloquée"
            : "Supprimer"}
      </button>

      {isBlocked ? (
        <p className="text-xs text-slate-500 sm:text-right">
          Supprime d’abord les contrats liés
        </p>
      ) : null}
    </div>
  );
}
