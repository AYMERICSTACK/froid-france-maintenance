"use client";

import { useRouter } from "next/navigation";

type BackButtonProps = {
  label?: string;
  fallbackHref?: string;
};

export default function BackButton({
  label = "Retour",
  fallbackHref = "/dashboard",
}: BackButtonProps) {
  const router = useRouter();

  function handleBack() {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push(fallbackHref);
    }
  }

  return (
    <button
      type="button"
      onClick={handleBack}
      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
    >
      <span>←</span>
      <span>{label}</span>
    </button>
  );
}
