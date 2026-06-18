"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Client = {
  id: string;
  firstName: string;
  lastName: string;
};

export default function ContractForm({
  clients,
  initialClientId = "",
}: {
  clients: Client[];
  initialClientId?: string;
}) {
  const router = useRouter();

  const [clientId, setClientId] = useState(initialClientId);
  const [equipmentType, setEquipmentType] = useState("");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [nextMaintenanceDate, setNextMaintenanceDate] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const selectedClient = useMemo(() => {
    return clients.find((c) => c.id === clientId);
  }, [clientId, clients]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/contracts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        clientId,
        equipmentType,
        brand,
        model,
        nextMaintenanceDate,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.message || "Erreur");
      setLoading(false);
      return;
    }

    router.push("/dashboard/contracts");
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="grid gap-5 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200"
    >
      {/* 🔥 Badge client sélectionné */}
      {selectedClient && (
        <div className="rounded-xl bg-blue-50 px-4 py-3 text-sm text-blue-700">
          Contrat pour :
          <span className="ml-1 font-semibold">
            {selectedClient.firstName} {selectedClient.lastName}
          </span>
        </div>
      )}

      {/* Select client */}
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">
          Client
        </label>

        <select
          value={clientId}
          onChange={(e) => setClientId(e.target.value)}
          required
          className="w-full rounded-xl border border-slate-200 px-4 py-3"
        >
          <option value="">Choisir un client</option>

          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.firstName} {c.lastName}
            </option>
          ))}
        </select>
      </div>

      {/* Inputs */}
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">
          Type d’équipement
        </label>
        <input
          placeholder="Ex : Climatisation, pompe à chaleur…"
          value={equipmentType}
          onChange={(e) => setEquipmentType(e.target.value)}
          required
          className="w-full rounded-xl border border-slate-200 px-4 py-3"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Marque
          </label>
          <input
            placeholder="Ex : Daikin"
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-4 py-3"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Modèle
          </label>
          <input
            placeholder="Ex : Stylish"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-4 py-3"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">
          Date de prochaine maintenance
        </label>
        <input
          type="date"
          value={nextMaintenanceDate}
          onChange={(e) => setNextMaintenanceDate(e.target.value)}
          required
          className="w-full rounded-xl border border-slate-200 px-4 py-3"
        />
        <p className="mt-2 rounded-xl bg-blue-50 px-3 py-2 text-xs font-medium text-blue-700">
          Cette date sert à déclencher le rappel automatique J-30 envoyé à Froid France.
        </p>
      </div>

      {error && (
        <p className="rounded-xl bg-red-50 px-4 py-2 text-sm text-red-600">
          {error}
        </p>
      )}

      <button
        disabled={loading}
        className="rounded-xl bg-[#0b79d0] px-5 py-3 font-semibold text-white transition hover:bg-[#0a6dbd] disabled:opacity-70"
      >
        {loading ? "Chargement..." : "Créer le contrat"}
      </button>
    </form>
  );
}
