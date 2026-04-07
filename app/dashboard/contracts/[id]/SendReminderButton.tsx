"use client";

import { useState } from "react";

export default function SendReminderButton({
  contractId,
}: {
  contractId: string;
}) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "">("");

  async function handleSend() {
    setLoading(true);
    setMessage("");
    setMessageType("");

    try {
      const res = await fetch(`/api/contracts/${contractId}/send-reminder`, {
        method: "POST",
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.message || "Erreur lors de l’envoi.");
        setMessageType("error");
        setLoading(false);
        return;
      }

      setMessage("Rappel envoyé avec succès.");
      setMessageType("success");
    } catch (error) {
      console.error(error);
      setMessage("Erreur serveur.");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full rounded-[32px] border border-white/70 bg-white/90 p-6 shadow-sm xl:w-[320px]">
      <div className="mb-5">
        <p className="text-sm font-semibold text-[#0b79d0]">Rappel manuel</p>
        <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-900">
          Envoyer un rappel
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          Déclenchez manuellement un email de rappel pour ce contrat.
        </p>
      </div>

      <button
        type="button"
        onClick={handleSend}
        disabled={loading}
        className="inline-flex w-full items-center justify-center rounded-2xl bg-[#e3342f] px-5 py-3 font-semibold text-white shadow-md transition hover:-translate-y-0.5 hover:bg-[#cc2b27] hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-70"
      >
        {loading ? "Envoi..." : "Envoyer un rappel"}
      </button>

      {message ? (
        <div
          className={`mt-4 rounded-2xl px-4 py-3 text-sm font-medium ${
            messageType === "success"
              ? "bg-emerald-50 text-emerald-700"
              : "bg-red-50 text-red-600"
          }`}
        >
          {message}
        </div>
      ) : null}
    </div>
  );
}
