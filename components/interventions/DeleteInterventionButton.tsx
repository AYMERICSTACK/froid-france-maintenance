"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DeleteInterventionButton({
  interventionId,
}: {
  interventionId: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    const confirmed = window.confirm("Supprimer cette intervention ?");
    if (!confirmed) return;

    setLoading(true);

    try {
      const res = await fetch(`/api/interventions/${interventionId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error();

      router.refresh();
    } catch {
      alert("Erreur lors de la suppression");
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
    >
      {loading ? "..." : "Supprimer"}
    </button>
  );
}
