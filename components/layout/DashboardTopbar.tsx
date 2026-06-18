"use client";

import { useEffect, useState } from "react";
import { Menu } from "lucide-react";
import LogoutButton from "@/components/ui/LogoutButton";
import DashboardSidebar from "@/components/layout/DashboardSidebar";
import { getRoleLabel } from "@/lib/permissions";
import type { UserRole } from "@prisma/client";

type DashboardTopbarProps = {
  user: {
    firstName: string;
    lastName: string;
    role: UserRole;
  } | null;
};

export default function DashboardTopbar({ user }: DashboardTopbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!mobileMenuOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileMenuOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [mobileMenuOpen]);

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-[1500px] items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50 xl:hidden"
              aria-label="Ouvrir le menu"
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-dashboard-menu"
            >
              <Menu className="h-5 w-5" />
            </button>

            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">
                Control Center
              </p>
              <h1 className="mt-1 truncate text-lg font-bold tracking-tight text-slate-950 sm:text-2xl">
                Froid France Climatisation
              </h1>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-3 sm:gap-4">
            <div className="hidden rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 sm:block">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                Session
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-900">
                {user
                  ? `${user.firstName} ${user.lastName} • ${getRoleLabel(user.role)}`
                  : "Utilisateur"}
              </p>
            </div>

            <LogoutButton />
          </div>
        </div>
      </header>

      <div id="mobile-dashboard-menu">
        <DashboardSidebar
          mobileOnly
          mobileOpen={mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
        />
      </div>
    </>
  );
}
