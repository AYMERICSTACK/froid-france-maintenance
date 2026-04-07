import { differenceInCalendarDays, startOfDay } from "date-fns";

export function getDaysUntilMaintenance(nextMaintenanceDate: Date | string) {
  const today = startOfDay(new Date());
  const target = startOfDay(new Date(nextMaintenanceDate));

  return differenceInCalendarDays(target, today);
}

export function getContractStatusLabel(date: Date | string) {
  const days = getDaysUntilMaintenance(date);

  if (days < 0) {
    return { label: "En retard", color: "bg-red-100 text-red-700" };
  }

  if (days <= 7) {
    return { label: `URGENT (${days}j)`, color: "bg-red-100 text-red-700" };
  }

  if (days <= 30) {
    return {
      label: `À venir (${days}j)`,
      color: "bg-amber-100 text-amber-700",
    };
  }

  return { label: "Planifié", color: "bg-emerald-100 text-emerald-700" };
}
