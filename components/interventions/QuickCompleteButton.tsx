"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  interventionId: string;
};

export default function QuickCompleteButton({ interventionId }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleQuickComplete() {
    const confirmed = window.confirm(
      "Marquer cette intervention comme terminée ?",
    );
    if (!confirmed) return;

    setLoading(true);

    try {
      const res = await fetch(
        `/api/interventions/${interventionId}/quick-complete`,
        { method: "POST" },
      );

      if (!res.ok) throw new Error();

      router.refresh();
    } catch {
      alert("Erreur lors de la validation");
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleQuickComplete}
      disabled={loading}
      className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
    >
      {loading ? "..." : "✔ Terminer"}
    </button>
  );
}
