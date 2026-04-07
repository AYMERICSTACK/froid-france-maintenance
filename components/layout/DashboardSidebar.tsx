"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { X, ChevronRight, Activity } from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/dashboard/clients", label: "Clients" },
  { href: "/dashboard/contracts", label: "Contrats" },
  { href: "/dashboard/planning", label: "Planning" },
  { href: "/dashboard/import", label: "Import CSV" },
];

type DashboardSidebarProps = {
  mobileOpen?: boolean;
  onClose?: () => void;
  mobileOnly?: boolean;
};

export default function DashboardSidebar({
  mobileOpen = false,
  onClose,
  mobileOnly = false,
}: DashboardSidebarProps) {
  const pathname = usePathname();

  const isActivePath = (href: string) => {
    if (href === "/dashboard") return pathname === href;
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const sidebarContent = (
    <>
      <div className="border-b border-slate-200 px-6 py-6">
        <div className="relative">
          {onClose ? (
            <button
              type="button"
              onClick={onClose}
              aria-label="Fermer le menu"
              className="absolute right-0 top-0 inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-700 transition hover:bg-slate-50 xl:hidden"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}

          <div className="flex flex-col items-center text-center">
            <Link
              href="/dashboard"
              onClick={onClose}
              className="group inline-flex justify-center"
            >
              <Image
                src="/logo.png"
                alt="Froid France Climatisation"
                width={110}
                height={110}
                className="object-contain transition duration-200 group-hover:scale-105"
              />
            </Link>

            <p className="mt-4 text-sm text-slate-500">
              Gestion maintenance & contrats
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4" aria-label="Navigation principale">
        <div className="space-y-1">
          {navItems.map((item) => {
            const isActive = isActivePath(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                aria-current={isActive ? "page" : undefined}
                className={`group flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? "bg-slate-900 text-white shadow"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <span>{item.label}</span>

                {isActive ? (
                  <span className="h-1.5 w-1.5 rounded-full bg-white" />
                ) : (
                  <ChevronRight className="h-4 w-4 opacity-0 transition group-hover:opacity-100" />
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="px-4 pb-5">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-slate-500" />
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
              Activité
            </p>
          </div>

          <p className="mt-2 text-sm font-semibold text-slate-900">
            Suivi en temps réel
          </p>

          <p className="mt-1 text-xs text-slate-500">
            Gardez un oeil sur vos contrats et échéances.
          </p>

          <div className="mt-3 h-1 w-12 rounded-full bg-slate-900" />
        </div>
      </div>
    </>
  );

  return (
    <>
      {!mobileOnly && (
        <aside className="hidden min-h-screen w-64 shrink-0 border-r border-slate-200 bg-white xl:flex xl:flex-col">
          {sidebarContent}
        </aside>
      )}

      {onClose ? (
        <>
          <div
            className={`fixed inset-0 z-40 bg-slate-900/45 backdrop-blur-[1px] transition xl:hidden ${
              mobileOpen
                ? "pointer-events-auto opacity-100"
                : "pointer-events-none opacity-0"
            }`}
            onClick={onClose}
            aria-hidden="true"
          />

          <aside
            role="dialog"
            aria-modal="true"
            aria-label="Menu mobile"
            className={`fixed inset-y-0 left-0 z-50 flex w-[88vw] max-w-xs flex-col border-r border-slate-200 bg-white shadow-2xl transition-transform duration-300 xl:hidden ${
              mobileOpen ? "translate-x-0" : "-translate-x-full"
            }`}
          >
            {sidebarContent}
          </aside>
        </>
      ) : null}
    </>
  );
}
