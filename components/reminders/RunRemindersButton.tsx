"use client";

import { useState } from "react";

export default function RunRemindersButton() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleClick() {
    setLoading(true);
    setSuccess(false);

    try {
      const res = await fetch("/api/reminders/run");

      if (!res.ok) throw new Error();

      setSuccess(true);
    } catch {
      alert("Erreur lors de l'envoi des rappels");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={handleClick}
        disabled={loading}
        className="rounded-xl bg-sky-600 px-4 py-2 font-semibold text-white hover:bg-sky-700 disabled:opacity-50"
      >
        {loading ? "Envoi en cours..." : "Envoyer rappels maintenant"}
      </button>

      {success && (
        <p className="inline-block animate-fade-in rounded-md bg-white px-3 py-1 text-sm font-medium text-emerald-700 ring-1 ring-emerald-200 shadow-sm">
          Rappels envoyés avec succès ✅
        </p>
      )}
    </div>
  );
}
