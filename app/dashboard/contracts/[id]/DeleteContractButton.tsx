"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type DeleteContractButtonProps = {
  contractId: string;
};

export default function DeleteContractButton({
  contractId,
}: DeleteContractButtonProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    const confirmed = window.confirm(
      "Voulez-vous vraiment supprimer ce contrat ? Cette action est définitive.",
    );

    if (!confirmed) return;

    setIsDeleting(true);

    try {
      const response = await fetch(`/api/contracts/${contractId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        alert(data?.error || "Impossible de supprimer le contrat.");
        setIsDeleting(false);
        return;
      }

      router.push("/dashboard/contracts");
      router.refresh();
    } catch {
      alert("Une erreur est survenue lors de la suppression.");
      setIsDeleting(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={isDeleting}
      className="inline-flex items-center justify-center rounded-2xl bg-red-600 px-5 py-3 font-semibold text-white shadow-md shadow-red-500/20 transition hover:-translate-y-0.5 hover:bg-red-700 hover:shadow-lg hover:shadow-red-500/25 disabled:cursor-not-allowed disabled:opacity-70"
    >
      {isDeleting ? "Suppression..." : "Supprimer"}
    </button>
  );
}
