"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type ContractStatus = "ACTIVE" | "INACTIVE" | "EXPIRED";

type EditContractFormProps = {
  contractId: string;
  initialData: {
    equipmentType: string;
    brand: string;
    model: string;
    subscriptionDate: string;
    lastMaintenanceDate: string;
    nextMaintenanceDate: string;
    frequencyMonths: number;
    status: ContractStatus;
    notes: string;
  };
};

function addMonthsToDateString(dateString: string, months: number) {
  if (!dateString || !months || months < 1) return "";

  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "";

  const result = new Date(date);
  result.setMonth(result.getMonth() + months);

  return result.toISOString().split("T")[0];
}

export default function EditContractForm({
  contractId,
  initialData,
}: EditContractFormProps) {
  const router = useRouter();

  const [formData, setFormData] = useState(initialData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const autoNextMaintenanceDate = useMemo(() => {
    if (!formData.lastMaintenanceDate || formData.frequencyMonths < 1) {
      return "";
    }

    return addMonthsToDateString(
      formData.lastMaintenanceDate,
      formData.frequencyMonths,
    );
  }, [formData.lastMaintenanceDate, formData.frequencyMonths]);

  const isAutoCalculated = Boolean(
    formData.lastMaintenanceDate && formData.frequencyMonths >= 1,
  );

  function handleChange(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "frequencyMonths" ? (value === "" ? 0 : Number(value)) : value,
    }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsSubmitting(true);

    try {
      const payload = {
        ...formData,
        nextMaintenanceDate: isAutoCalculated
          ? autoNextMaintenanceDate
          : formData.nextMaintenanceDate,
      };

      const response = await fetch(`/api/contracts/${contractId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Impossible de modifier le contrat.");
        setIsSubmitting(false);
        return;
      }

      setSuccess("Contrat modifié avec succès.");
      router.push(`/dashboard/contracts/${contractId}`);
      router.refresh();
    } catch {
      setError("Une erreur est survenue lors de la modification.");
      setIsSubmitting(false);
    }
  }

  async function handleDelete() {
    const confirmed = window.confirm(
      "Voulez-vous vraiment supprimer ce contrat ? Cette action est définitive.",
    );

    if (!confirmed) return;

    setError("");
    setSuccess("");
    setIsDeleting(true);

    try {
      const response = await fetch(`/api/contracts/${contractId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Impossible de supprimer le contrat.");
        setIsDeleting(false);
        return;
      }

      router.push("/dashboard/contracts");
      router.refresh();
    } catch {
      setError("Une erreur est survenue lors de la suppression.");
      setIsDeleting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-[28px] bg-white p-6 shadow-sm ring-1 ring-slate-200"
    >
      <div className="grid gap-5 md:grid-cols-2">
        <div>
          <label
            htmlFor="equipmentType"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            Type d’équipement
          </label>
          <input
            id="equipmentType"
            name="equipmentType"
            type="text"
            value={formData.equipmentType}
            onChange={handleChange}
            required
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-[#0b79d0]"
          />
        </div>

        <div>
          <label
            htmlFor="status"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            Statut
          </label>
          <select
            id="status"
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-[#0b79d0]"
          >
            <option value="ACTIVE">Actif</option>
            <option value="INACTIVE">Inactif</option>
            <option value="EXPIRED">Expiré</option>
          </select>
        </div>

        <div>
          <label
            htmlFor="brand"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            Marque
          </label>
          <input
            id="brand"
            name="brand"
            type="text"
            value={formData.brand}
            onChange={handleChange}
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-[#0b79d0]"
          />
        </div>

        <div>
          <label
            htmlFor="model"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            Modèle
          </label>
          <input
            id="model"
            name="model"
            type="text"
            value={formData.model}
            onChange={handleChange}
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-[#0b79d0]"
          />
        </div>

        <div>
          <label
            htmlFor="subscriptionDate"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            Date de souscription
          </label>
          <input
            id="subscriptionDate"
            name="subscriptionDate"
            type="date"
            value={formData.subscriptionDate}
            onChange={handleChange}
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-[#0b79d0]"
          />
        </div>

        <div>
          <label
            htmlFor="lastMaintenanceDate"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            Dernier entretien
          </label>
          <input
            id="lastMaintenanceDate"
            name="lastMaintenanceDate"
            type="date"
            value={formData.lastMaintenanceDate}
            onChange={handleChange}
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-[#0b79d0]"
          />
        </div>

        <div>
          <label
            htmlFor="nextMaintenanceDate"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            Prochain entretien
          </label>
          <input
            id="nextMaintenanceDate"
            name="nextMaintenanceDate"
            type="date"
            value={
              isAutoCalculated
                ? autoNextMaintenanceDate
                : formData.nextMaintenanceDate
            }
            onChange={handleChange}
            required
            disabled={isAutoCalculated}
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-[#0b79d0] disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500"
          />
          <p className="mt-2 text-xs text-slate-500">
            {isAutoCalculated
              ? "Date recalculée automatiquement à partir du dernier entretien et de la fréquence."
              : "Saisie manuelle tant que le dernier entretien n’est pas renseigné."}
          </p>
        </div>

        <div>
          <label
            htmlFor="frequencyMonths"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            Fréquence (mois)
          </label>
          <input
            id="frequencyMonths"
            name="frequencyMonths"
            type="number"
            min={1}
            value={formData.frequencyMonths}
            onChange={handleChange}
            required
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-[#0b79d0]"
          />
        </div>
      </div>

      <div className="mt-5">
        <label
          htmlFor="notes"
          className="mb-2 block text-sm font-medium text-slate-700"
        >
          Notes
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={5}
          value={formData.notes}
          onChange={handleChange}
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-[#0b79d0]"
        />
      </div>

      {error && (
        <div className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
          {error}
        </div>
      )}

      {success && (
        <div className="mt-4 rounded-2xl bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
          {success}
        </div>
      )}

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={isSubmitting || isDeleting}
          className="rounded-2xl bg-[#0b79d0] px-5 py-3 font-semibold text-white shadow-md transition hover:-translate-y-0.5 hover:bg-[#0a6dbd] hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting ? "Enregistrement..." : "Enregistrer les modifications"}
        </button>

        <button
          type="button"
          onClick={() => router.push(`/dashboard/contracts/${contractId}`)}
          disabled={isSubmitting || isDeleting}
          className="rounded-2xl border border-slate-200 px-5 py-3 font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
        >
          Annuler
        </button>

        <button
          type="button"
          onClick={handleDelete}
          disabled={isSubmitting || isDeleting}
          className="rounded-2xl bg-red-600 px-5 py-3 font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isDeleting ? "Suppression..." : "Supprimer le contrat"}
        </button>
      </div>
    </form>
  );
}
