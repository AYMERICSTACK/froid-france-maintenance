import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { canManageAdminFeatures } from "@/lib/permissions";

export default async function ImportPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (!canManageAdminFeatures(user.role)) {
    return (
      <main>
        <div className="rounded-[28px] bg-white p-8 shadow-sm ring-1 ring-slate-200">
          <p className="text-sm font-semibold text-[#0b79d0]">Accès limité</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">
            Module administrateur
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-500">
            L'import CSV est réservé au rôle administrateur. Les techniciens
            gardent accès aux clients, contrats, planning et interventions
            terrain.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main>
      <div className="mb-6">
        <p className="text-sm font-semibold text-[#0b79d0]">Import</p>
        <h1 className="text-3xl font-bold text-slate-900">Import CSV</h1>
        <p className="mt-2 text-sm text-slate-500">
          Importez vos clients et contrats depuis un fichier CSV.
        </p>
      </div>

      <div className="rounded-[28px] bg-white p-8 shadow-sm ring-1 ring-slate-200">
        <p className="text-slate-700">
          Module de démonstration prêt pour l'import de données existantes.
        </p>

        <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
          <p className="font-medium text-slate-700">Zone d'import CSV</p>
          <p className="mt-2 text-sm text-slate-500">
            Vous pourrez déposer ici un export CSV / Excel pour intégrer
            automatiquement les clients et contrats existants.
          </p>
        </div>
      </div>
    </main>
  );
}
