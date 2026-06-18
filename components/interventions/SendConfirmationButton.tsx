"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MailCheck } from "lucide-react";

export default function SendConfirmationButton({
  interventionId,
  disabledReason,
}: {
  interventionId: string;
  disabledReason?: string;
}) {
  const router = useRouter();
  const [isSending, setIsSending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    if (disabledReason) {
      setError(disabledReason);
      return;
    }

    setIsSending(true);
    setMessage(null);
    setError(null);

    try {
      const response = await fetch(
        `/api/interventions/${interventionId}/send-confirmation`,
        {
          method: "POST",
        },
      );
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        setError(data?.message || "Impossible d'envoyer la confirmation.");
        return;
      }

      setMessage(data?.message || "Confirmation envoyée au client.");
      router.refresh();
    } catch {
      setError("Une erreur est survenue pendant l'envoi.");
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={isSending}
        className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-md transition hover:-translate-y-0.5 hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <MailCheck className="h-4 w-4" />
        {isSending ? "Envoi en cours..." : "Envoyer confirmation RDV"}
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
