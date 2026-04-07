"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CompleteInterventionButton({
  interventionId,
}: {
  interventionId: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleComplete() {
    const confirmed = window.confirm(
      "Marquer cette intervention comme faite ?",
    );

    if (!confirmed) return;

    setLoading(true);

    try {
      const response = await fetch(
        `/api/interventions/${interventionId}/complete`,
        {
          method: "PATCH",
        },
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        alert(data?.message || "Impossible de valider l’intervention.");
        setLoading(false);
        return;
      }

      router.refresh();
    } catch {
      alert("Une erreur est survenue lors de la validation.");
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleComplete}
      disabled={loading}
      className="inline-flex items-center justify-center rounded-2xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-emerald-700 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-70"
    >
      {loading ? "Validation..." : "Marquer comme faite"}
    </button>
  );
}
