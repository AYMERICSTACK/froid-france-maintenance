// components/clients/ClientHeader.tsx

"use client";

import { Mail, Phone, MapPin, Pencil, Plus } from "lucide-react";

type Props = {
  client: {
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    city?: string;
  };
};

export default function ClientHeader({ client }: Props) {
  return (
    <div className="flex flex-col gap-6 rounded-2xl bg-white p-6 shadow-sm border">
      <div className="flex items-start justify-between">
        {/* Infos */}
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            {client.firstName} {client.lastName}
          </h1>

          <div className="mt-2 flex flex-wrap gap-4 text-sm text-gray-500">
            {client.email && (
              <span className="flex items-center gap-1">
                <Mail className="h-4 w-4" />
                {client.email}
              </span>
            )}
            {client.phone && (
              <span className="flex items-center gap-1">
                <Phone className="h-4 w-4" />
                {client.phone}
              </span>
            )}
            {client.city && (
              <span className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {client.city}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button className="flex items-center gap-2 rounded-lg border px-4 py-2 text-sm hover:bg-gray-50">
            <Pencil className="h-4 w-4" />
            Modifier
          </button>

          <button className="flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-sm text-white hover:opacity-90">
            <Plus className="h-4 w-4" />
            Contrat
          </button>
        </div>
      </div>
    </div>
  );
}
