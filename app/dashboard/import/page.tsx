export default function ImportPage() {
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
          Module de demonstration pret pour l import de donnees existantes.
        </p>

        <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
          <p className="font-medium text-slate-700">Zone d import CSV</p>
          <p className="mt-2 text-sm text-slate-500">
            Vous pourrez deposer ici un export CSV / Excel pour integrer
            automatiquement les clients et contrats existants.
          </p>
        </div>
      </div>
    </main>
  );
}
