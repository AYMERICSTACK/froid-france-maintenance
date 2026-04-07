"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import BackButton from "@/components/ui/BackButton";

type Client = {
  id: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  postalCode: string | null;
  notes: string | null;
  contracts?: { id: string }[];
};

export default function EditClientForm({ client }: { client: Client }) {
  const router = useRouter();

  const [firstName, setFirstName] = useState(client.firstName);
  const [lastName, setLastName] = useState(client.lastName);
  const [phone, setPhone] = useState(client.phone || "");
  const [email, setEmail] = useState(client.email || "");
  const [address, setAddress] = useState(client.address || "");
  const [city, setCity] = useState(client.city || "");
  const [postalCode, setPostalCode] = useState(client.postalCode || "");
  const [notes, setNotes] = useState(client.notes || "");
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(`/api/clients/${client.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName,
          lastName,
          phone,
          email,
          address,
          city,
          postalCode,
          notes,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Impossible de modifier le client.");
        setLoading(false);
        return;
      }

      router.push("/dashboard/clients");
      router.refresh();
    } catch (err) {
      console.error(err);
      setError("Une erreur est survenue.");
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (deleteBlocked) {
      setError(
        `Impossible de supprimer ce client : ${contractsCount} contrat${contractsCount > 1 ? "s sont encore liés" : " est encore lié"} à sa fiche.`,
      );
      return;
    }

    const confirmed = window.confirm(
      `Voulez-vous vraiment supprimer ${client.firstName} ${client.lastName} ?`,
    );

    if (!confirmed) return;

    setError("");
    setDeleting(true);

    try {
      const response = await fetch(`/api/clients/${client.id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Impossible de supprimer le client.");
        setDeleting(false);
        return;
      }

      router.push("/dashboard/clients");
      router.refresh();
    } catch (err) {
      console.error(err);
      setError("Une erreur est survenue lors de la suppression.");
      setDeleting(false);
    }
  }

  const contractsCount = client.contracts?.length || 0;
  const deleteBlocked = contractsCount > 0;

  return (
    <main>
      <div className="mb-6 flex items-center gap-3">
        <BackButton fallbackHref="/dashboard/clients" />
        <div>
          <p className="text-sm font-semibold text-[#0b79d0]">Clients</p>
          <h1 className="text-3xl font-bold text-slate-900">
            Modifier un client
          </h1>
        </div>
      </div>

      <div className="rounded-[28px] bg-white p-8 shadow-sm ring-1 ring-slate-200">
        <form onSubmit={handleSubmit} className="grid gap-5 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Prénom
            </label>
            <input
              type="text"
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-[#0b79d0]"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Nom
            </label>
            <input
              type="text"
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-[#0b79d0]"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Téléphone
            </label>
            <input
              type="text"
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-[#0b79d0]"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Email
            </label>
            <input
              type="email"
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-[#0b79d0]"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Adresse
            </label>
            <input
              type="text"
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-[#0b79d0]"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Ville
            </label>
            <input
              type="text"
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-[#0b79d0]"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Code postal
            </label>
            <input
              type="text"
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-[#0b79d0]"
              value={postalCode}
              onChange={(e) => setPostalCode(e.target.value)}
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Notes
            </label>
            <textarea
              className="min-h-32 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-[#0b79d0]"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {error ? (
            <div className="md:col-span-2 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          ) : null}

          {deleteBlocked ? (
            <div className="md:col-span-2 rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-700">
              Ce client ne peut pas être supprimé tant que des contrats lui sont
              encore liés.
            </div>
          ) : null}

          <div className="md:col-span-2 flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={loading || deleting}
              className="rounded-2xl bg-[#0b79d0] px-5 py-3 font-semibold text-white shadow-md transition hover:-translate-y-0.5 hover:bg-[#0a6dbd] hover:shadow-lg disabled:opacity-70"
            >
              {loading ? "Enregistrement..." : "Enregistrer les modifications"}
            </button>

            <button
              type="button"
              onClick={() => router.push("/dashboard/clients")}
              disabled={loading || deleting}
              className="rounded-2xl border border-slate-200 bg-white px-5 py-3 font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-70"
            >
              Annuler
            </button>

            <button
              type="button"
              onClick={handleDelete}
              disabled={loading || deleting || deleteBlocked}
              title={
                deleteBlocked
                  ? "Suppression impossible tant que des contrats sont liés à ce client."
                  : "Supprimer ce client"
              }
              className={`rounded-2xl px-5 py-3 font-semibold text-white transition disabled:opacity-70 ${
                deleteBlocked
                  ? "cursor-not-allowed bg-slate-300"
                  : "bg-red-600 hover:bg-red-700"
              }`}
            >
              {deleting ? "Suppression..." : "Supprimer ce client"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
