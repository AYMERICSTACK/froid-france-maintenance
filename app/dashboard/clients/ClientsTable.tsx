"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Search,
  Users,
  FileText,
  CircleAlert,
  Plus,
  Eye,
  Pencil,
  Phone,
  Mail,
  MapPin,
} from "lucide-react";
import DeleteClientButton from "./DeleteClientButton";

type Client = {
  id: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  email?: string | null;
  city?: string | null;
  createdAt: string | Date;
  contracts: { id: string }[];
};

function getClientStatus(count: number) {
  return count > 0
    ? {
        label: "Actif",
        className:
          "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200",
      }
    : {
        label: "À compléter",
        className:
          "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200",
      };
}

function normalize(value: string | null | undefined) {
  return (value || "").toLowerCase().trim();
}

function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString("fr-FR");
}

function getFullName(client: Client) {
  return `${client.firstName} ${client.lastName}`.trim();
}

function getSearchScore(client: Client, term: string) {
  if (!term) return 0;

  const firstName = normalize(client.firstName);
  const lastName = normalize(client.lastName);
  const fullName = `${firstName} ${lastName}`.trim();
  const reverseFullName = `${lastName} ${firstName}`.trim();
  const email = normalize(client.email);
  const phone = normalize(client.phone);
  const city = normalize(client.city);

  if (fullName === term || reverseFullName === term) return 100;
  if (firstName === term || lastName === term) return 95;

  if (fullName.startsWith(term) || reverseFullName.startsWith(term)) return 90;
  if (firstName.startsWith(term) || lastName.startsWith(term)) return 85;

  if (fullName.includes(term) || reverseFullName.includes(term)) return 70;
  if (firstName.includes(term) || lastName.includes(term)) return 65;

  if (phone.startsWith(term)) return 55;
  if (email.startsWith(term)) return 50;
  if (city.startsWith(term)) return 45;

  if (phone.includes(term)) return 35;
  if (email.includes(term)) return 30;
  if (city.includes(term)) return 25;

  return -1;
}

export default function ClientsTable({ clients }: { clients: Client[] }) {
  const [search, setSearch] = useState("");

  const stats = useMemo(() => {
    const activeClientsCount = clients.filter(
      (client) => client.contracts.length > 0,
    ).length;

    const noContractCount = clients.filter(
      (client) => client.contracts.length === 0,
    ).length;

    const totalContractsCount = clients.reduce(
      (acc, client) => acc + client.contracts.length,
      0,
    );

    return {
      totalClientsCount: clients.length,
      activeClientsCount,
      noContractCount,
      totalContractsCount,
    };
  }, [clients]);

  const filteredClients = useMemo(() => {
    const term = normalize(search);

    if (!term) {
      return [...clients].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
    }

    return [...clients]
      .map((client) => ({
        client,
        score: getSearchScore(client, term),
      }))
      .filter((item) => item.score >= 0)
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;

        return getFullName(a.client).localeCompare(
          getFullName(b.client),
          "fr",
          {
            sensitivity: "base",
          },
        );
      })
      .map((item) => item.client);
  }, [clients, search]);

  return (
    <main className="space-y-6">
      <section className="rounded-[32px] border border-white/70 bg-white/90 p-6 shadow-sm">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="inline-flex items-center rounded-full bg-[#0b79d0]/8 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#0b79d0]">
              Gestion clients
            </div>

            <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Clients
            </h1>

            <p className="mt-3 max-w-2xl text-sm text-slate-500">
              Recherchez rapidement un client, consultez ses informations et
              accédez à sa fiche en un clic.
            </p>
          </div>

          <Link
            href="/dashboard/clients/new"
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#0b79d0] px-5 py-3 font-semibold text-white shadow-md transition hover:-translate-y-0.5 hover:bg-[#0a6dbd] hover:shadow-lg"
          >
            <Plus className="h-4 w-4" />
            Ajouter un client
          </Link>
        </div>
      </section>

      <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-[30px] border border-white/70 bg-white/90 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">Total clients</p>
            <Users className="h-5 w-5 text-slate-400" />
          </div>
          <p className="mt-4 text-4xl font-bold tracking-tight text-slate-950">
            {stats.totalClientsCount}
          </p>
          <div className="mt-5 h-1.5 w-16 rounded-full bg-[#0b79d0]" />
        </div>

        <div className="rounded-[30px] border border-white/70 bg-white/90 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">Clients actifs</p>
            <Users className="h-5 w-5 text-slate-400" />
          </div>
          <p className="mt-4 text-4xl font-bold tracking-tight text-slate-950">
            {stats.activeClientsCount}
          </p>
          <div className="mt-5 h-1.5 w-16 rounded-full bg-emerald-500" />
        </div>

        <div className="rounded-[30px] border border-white/70 bg-white/90 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">Sans contrat</p>
            <CircleAlert className="h-5 w-5 text-slate-400" />
          </div>
          <p className="mt-4 text-4xl font-bold tracking-tight text-slate-950">
            {stats.noContractCount}
          </p>
          <div className="mt-5 h-1.5 w-16 rounded-full bg-amber-500" />
        </div>

        <div className="rounded-[30px] border border-white/70 bg-white/90 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">Contrats liés</p>
            <FileText className="h-5 w-5 text-slate-400" />
          </div>
          <p className="mt-4 text-4xl font-bold tracking-tight text-slate-950">
            {stats.totalContractsCount}
          </p>
          <div className="mt-5 h-1.5 w-16 rounded-full bg-cyan-500" />
        </div>
      </section>

      <section className="overflow-hidden rounded-[32px] border border-white/70 bg-white/90 shadow-sm">
        <div className="border-b border-slate-100 px-4 py-5 sm:px-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold text-[#0b79d0]">
                Base clients
              </p>
              <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
                Liste des clients
              </h2>
            </div>

            <div className="relative w-full max-w-xl">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher un client, email, téléphone, ville..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm text-slate-900 outline-none transition focus:border-[#0b79d0] focus:ring-4 focus:ring-[#0b79d0]/10"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-4 sm:px-6">
          <p className="text-sm font-semibold text-slate-900">
            {filteredClients.length} résultat
            {filteredClients.length > 1 ? "s" : ""}
          </p>

          {search ? (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="text-sm font-semibold text-slate-500 transition hover:text-slate-900"
            >
              Réinitialiser
            </button>
          ) : null}
        </div>

        {filteredClients.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-sm font-medium text-slate-900">
              Aucun client trouvé
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Essaie un autre nom, email, téléphone ou ville.
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-3 p-4 sm:hidden">
              {filteredClients.map((client) => {
                const contractsCount = client.contracts.length;
                const status = getClientStatus(contractsCount);

                return (
                  <div
                    key={client.id}
                    className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <Link
                          href={`/dashboard/clients/${client.id}`}
                          className="block"
                        >
                          <p className="text-lg font-semibold text-slate-950">
                            {getFullName(client)}
                          </p>
                        </Link>

                        <p className="mt-1 text-sm text-slate-500">
                          Créé le {formatDate(client.createdAt)}
                        </p>
                      </div>

                      <span
                        className={`inline-flex shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${status.className}`}
                      >
                        {status.label}
                      </span>
                    </div>

                    <div className="mt-4 space-y-3 text-sm">
                      <div className="flex items-start gap-2 text-slate-600">
                        <Phone className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                        <span>{client.phone || "-"}</span>
                      </div>

                      <div className="flex items-start gap-2 text-slate-600">
                        <Mail className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                        <span className="break-all">{client.email || "-"}</span>
                      </div>

                      <div className="flex items-start gap-2 text-slate-600">
                        <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                        <span>{client.city || "-"}</span>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-3">
                      <span className="text-sm text-slate-500">Contrats</span>
                      <span className="inline-flex rounded-full bg-white px-3 py-1 text-sm font-semibold text-slate-700 ring-1 ring-inset ring-slate-200">
                        {contractsCount} contrat{contractsCount > 1 ? "s" : ""}
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <Link
                        href={`/dashboard/clients/${client.id}`}
                        className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                      >
                        <Eye className="mr-1.5 h-4 w-4" />
                        Voir
                      </Link>

                      <Link
                        href={`/dashboard/clients/${client.id}/edit`}
                        className="inline-flex items-center justify-center rounded-xl bg-[#0b79d0] px-3 py-2.5 text-sm font-medium text-white transition hover:bg-[#0a6dbd]"
                      >
                        <Pencil className="mr-1.5 h-4 w-4" />
                        Modifier
                      </Link>
                    </div>

                    <div className="mt-2">
                      <DeleteClientButton
                        clientId={client.id}
                        clientName={getFullName(client)}
                        contractsCount={contractsCount}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="hidden overflow-x-auto sm:block">
              <table className="w-full min-w-[1000px] text-left">
                <thead className="bg-slate-50/80">
                  <tr className="text-xs uppercase tracking-wider text-slate-400">
                    <th className="px-6 py-4 font-semibold">Client</th>
                    <th className="px-6 py-4 font-semibold">Contact</th>
                    <th className="px-6 py-4 font-semibold">Ville</th>
                    <th className="px-6 py-4 font-semibold">Contrats</th>
                    <th className="px-6 py-4 font-semibold">Statut</th>
                    <th className="px-6 py-4 text-right font-semibold">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredClients.map((client) => {
                    const contractsCount = client.contracts.length;
                    const status = getClientStatus(contractsCount);

                    return (
                      <tr
                        key={client.id}
                        className="border-t border-slate-100 transition hover:bg-slate-50/70"
                      >
                        <td className="px-6 py-5">
                          <Link
                            href={`/dashboard/clients/${client.id}`}
                            className="block"
                          >
                            <p className="font-semibold text-slate-950 transition hover:text-[#0b79d0]">
                              {getFullName(client)}
                            </p>
                            <p className="mt-1 text-sm text-slate-500">
                              Créé le {formatDate(client.createdAt)}
                            </p>
                          </Link>
                        </td>

                        <td className="px-6 py-5 text-sm text-slate-600">
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-slate-400" />
                            <span>{client.phone || "-"}</span>
                          </div>
                          <div className="mt-1.5 flex items-center gap-2 text-slate-400">
                            <Mail className="h-4 w-4" />
                            <span className="max-w-[220px] truncate">
                              {client.email || "-"}
                            </span>
                          </div>
                        </td>

                        <td className="px-6 py-5 text-sm text-slate-700">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-slate-400" />
                            <span>{client.city || "-"}</span>
                          </div>
                        </td>

                        <td className="px-6 py-5">
                          <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700 ring-1 ring-inset ring-slate-200">
                            {contractsCount} contrat{contractsCount > 1 ? "s" : ""}
                          </span>
                        </td>

                        <td className="px-6 py-5">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${status.className}`}
                          >
                            {status.label}
                          </span>
                        </td>

                        <td className="px-6 py-5">
                          <div className="flex justify-end gap-2">
                            <Link
                              href={`/dashboard/clients/${client.id}`}
                              title="Voir la fiche client"
                              aria-label="Voir la fiche client"
                              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
                            >
                              <Eye className="h-4 w-4" />
                            </Link>

                            <Link
                              href={`/dashboard/clients/${client.id}/edit`}
                              title="Modifier le client"
                              aria-label="Modifier le client"
                              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[#0b79d0]/20 bg-white text-[#0b79d0] transition hover:border-[#0b79d0]/30 hover:bg-[#0b79d0]/5"
                            >
                              <Pencil className="h-4 w-4" />
                            </Link>

                            <DeleteClientButton
                              clientId={client.id}
                              clientName={getFullName(client)}
                              contractsCount={contractsCount}
                              variant="compact"
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>
    </main>
  );
}
