// components/clients/ClientStats.tsx

type Props = {
  contractsCount: number;
  upcoming: number;
  overdue: number;
};

export default function ClientStats({
  contractsCount,
  upcoming,
  overdue,
}: Props) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card title="Contrats" value={contractsCount} />
      <Card title="À venir" value={upcoming} />
      <Card title="En retard" value={overdue} danger />
    </div>
  );
}

function Card({
  title,
  value,
  danger,
}: {
  title: string;
  value: number;
  danger?: boolean;
}) {
  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm">
      <p className="text-sm text-gray-500">{title}</p>
      <p
        className={`text-2xl font-semibold ${
          danger ? "text-red-600" : "text-gray-900"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
