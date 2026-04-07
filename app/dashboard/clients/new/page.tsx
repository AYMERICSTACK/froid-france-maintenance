"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import BackButton from "@/components/ui/BackButton";

export default function NewClientPage() {
  const router = useRouter();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/clients", {
        method: "POST",
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
        setError(data.message || "Impossible de creer le client.");
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

  return (
    <main>
      <div className="mb-6 flex items-center gap-3">
        <BackButton />
        <div>
          <p className="text-sm font-semibold text-[#0b79d0]">Clients</p>
          <h1 className="text-3xl font-bold text-slate-900">
            Ajouter un client
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
              placeholder="Jean"
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
              placeholder="Martin"
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
              placeholder="06 00 00 00 00"
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
              placeholder="client@email.fr"
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
              placeholder="12 rue ..."
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
              placeholder="Bourg-en-Bresse"
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
              placeholder="01000"
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
              placeholder="Informations utiles sur le client..."
            />
          </div>

          {error ? (
            <div className="md:col-span-2 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          ) : null}

          <div className="md:col-span-2 flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={loading}
              className="rounded-2xl bg-[#0b79d0] px-5 py-3 font-semibold text-white shadow-md transition hover:-translate-y-0.5 hover:bg-[#0a6dbd] hover:shadow-lg disabled:opacity-70"
            >
              {loading ? "Enregistrement..." : "Enregistrer le client"}
            </button>

            <button
              type="button"
              onClick={() => router.push("/dashboard/clients")}
              className="rounded-2xl border border-slate-200 bg-white px-5 py-3 font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Annuler
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
