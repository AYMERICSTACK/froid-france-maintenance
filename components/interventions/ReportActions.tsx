"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileDown, Send } from "lucide-react";

export default function ReportActions({
  interventionId,
}: {
  interventionId: string;
}) {
  const router = useRouter();
  const [isSending, setIsSending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function sendReport() {
    setIsSending(true);
    setMessage(null);
    setError(null);

    try {
      const response = await fetch(
        `/api/interventions/${interventionId}/send-report`,
        {
          method: "POST",
        },
      );
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        setError(data?.message || "Impossible d'envoyer le rapport.");
        return;
      }

      setMessage(data?.message || "Rapport envoyé au client.");
      router.refresh();
    } catch {
      setError("Une erreur est survenue pendant l'envoi.");
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="space-y-2">
      <a
        href={`/api/interventions/${interventionId}/report`}
        className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
      >
        <FileDown className="h-4 w-4" />
        Télécharger le rapport PDF
      </a>

      <button
        type="button"
        onClick={sendReport}
        disabled={isSending}
        className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-md transition hover:-translate-y-0.5 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Send className="h-4 w-4" />
        {isSending ? "Envoi en cours..." : "Envoyer rapport au client"}
      </button>

      {message && (
        <p className="rounded-xl bg-white px-3 py-2 text-sm font-semibold text-emerald-700 ring-1 ring-emerald-100">
          {message}
        </p>
      )}

      {error && (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 ring-1 ring-red-100">
          {error}
        </p>
      )}
    </div>
  );
}
