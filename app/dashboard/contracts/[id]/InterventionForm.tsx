"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import InterventionChecklist from "@/components/interventions/InterventionChecklist";

function generateAutoNote(checklist: string[]) {
  if (checklist.length === 0) return "";

  return `Intervention réalisée :\n- ${checklist.join("\n- ")}`;
}

export default function InterventionForm({
  contractId,
}: {
  contractId: string;
}) {
  const router = useRouter();

  const [date, setDate] = useState("");
  const [time, setTime] = useState("09:00");
  const [notes, setNotes] = useState("");
  const [checklist, setChecklist] = useState<string[]>([]);
  const [clientSignature, setClientSignature] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const autoNote = generateAutoNote(checklist);
    const finalNotes =
      notes ||
      [autoNote, clientSignature ? `Validé par : ${clientSignature}` : ""]
        .filter(Boolean)
        .join("\n\n");

    try {
      const res = await fetch("/api/interventions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contractId,
          plannedDate: `${date}T${time}`,
          notes: finalNotes,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setError(data?.message || "Impossible de programmer l’intervention.");
        setLoading(false);
        return;
      }

      router.refresh();
      setDate("");
      setTime("09:00");
      setNotes("");
      setChecklist([]);
      setClientSignature("");
    } catch {
      setError("Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      className="rounded-[32px] border border-white/70 bg-white/90 p-6 shadow-sm"
      onSubmit={submit}
    >
      <div className="mb-6">
        <p className="text-sm font-semibold text-[#0b79d0]">
          Nouvelle intervention
        </p>
        <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
          Programmer une intervention
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          Choisissez directement la date et l’heure du rendez-vous convenu avec le client.
        </p>
      </div>

      <div className="grid gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Date du rendez-vous
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-[#0b79d0] focus:bg-white focus:ring-4 focus:ring-[#0b79d0]/10"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Heure du rendez-vous
            </label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              required
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-[#0b79d0] focus:bg-white focus:ring-4 focus:ring-[#0b79d0]/10"
            />
          </div>
        </div>

        <p className="rounded-2xl bg-[#0b79d0]/8 px-4 py-3 text-sm font-medium text-[#0b79d0] ring-1 ring-[#0b79d0]/10">
          Cette date correspond au rendez-vous terrain. Elle sera reprise dans l’email de confirmation envoyé au client.
        </p>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Notes internes
          </label>
          <textarea
            placeholder="Ex : maintenance annuelle, accès par le portail, appeler avant d’arriver…"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-[#0b79d0] focus:bg-white focus:ring-4 focus:ring-[#0b79d0]/10"
          />
        </div>

        <InterventionChecklist onChange={setChecklist} />

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Validation client
          </label>
          <input
            type="text"
            value={clientSignature}
            onChange={(e) => setClientSignature(e.target.value)}
            placeholder="Nom du client"
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-[#0b79d0] focus:bg-white focus:ring-4 focus:ring-[#0b79d0]/10"
          />
        </div>

        {error ? (
          <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
            {error}
          </div>
        ) : null}

        <div className="pt-1">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center rounded-2xl bg-[#0b79d0] px-5 py-3 font-semibold text-white shadow-md transition hover:-translate-y-0.5 hover:bg-[#0a6dbd] hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? "Création..." : "Programmer l’intervention"}
          </button>
        </div>
      </div>
    </form>
  );
}
