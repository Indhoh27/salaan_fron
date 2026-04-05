import { useMemo } from "react";
import { FaBars, FaWandSparkles } from "react-icons/fa6";
import { useLocation } from "react-router-dom";
import { useAppSelector } from "../../Redux/hooks";

const pathTitles: Record<string, string> = {
  "/dashboard": "Overview",
  "/dashboard/jobs": "Jobs & repairs",
  "/dashboard/inventory": "Inventory",
  "/dashboard/sales": "Sales",
  "/dashboard/expenses": "Expenses",
  "/dashboard/reports": "Reports",
  "/dashboard/users": "Users",
  "/dashboard/settings": "Settings",
};

type NavbarProps = {
  onMenuClick: () => void;
};

export default function Navbar({ onMenuClick }: NavbarProps) {
  const location = useLocation();
  const user = useAppSelector((s) => s.auth.user);

  const pageTitle = useMemo(() => pathTitles[location.pathname] ?? "Dashboard", [location.pathname]);

  const shortName = user?.fullName?.split(/\s+/)[0] ?? user?.email?.split("@")[0] ?? "";

  return (
    <header className="sticky top-0 z-20 shrink-0 border-b border-slate-200/80 bg-white/85 px-3 py-3 shadow-sm backdrop-blur-xl dark:border-slate-700/60 dark:bg-slate-900/85 sm:px-5">
      <div className="mx-auto flex max-w-7xl items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded border border-slate-200/90 bg-gradient-to-b from-white to-slate-50 text-slate-700 shadow-sm transition hover:border-blue-300 hover:text-blue-600 active:scale-95 dark:border-slate-600 dark:from-slate-800 dark:to-slate-900 dark:text-slate-200 dark:hover:border-blue-500/50 md:hidden"
          aria-label="Open menu"
        >
          <FaBars className="h-5 w-5" />
        </button>

        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="hidden h-9 w-9 shrink-0 items-center justify-center rounded bg-gradient-to-br from-blue-600 to-indigo-600 text-sm font-bold text-white shadow-md shadow-blue-600/30 md:flex">
            S
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">

              <h1 className="truncate text-base font-bold tracking-tight text-slate-900 dark:text-white sm:text-lg">
                {pageTitle}
              </h1>
            </div>
            <p className="mt-0.5 truncate pl-8 text-xs font-medium text-slate-500 dark:text-slate-400">
              <span className="hidden sm:inline">Salaan Solution · </span>
              Nice to have you here{shortName ? `, ${shortName}` : ""}
            </p>
          </div>
        </div>

        <div className="hidden shrink-0 items-center gap-2 rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50/90 to-indigo-50/80 px-3 py-2 dark:border-blue-500/20 dark:from-blue-950/40 dark:to-indigo-950/30 sm:flex">
          <FaWandSparkles className="h-4 w-4 text-blue-600 dark:text-blue-400" aria-hidden />
          <span className="text-xs font-bold text-blue-700 dark:text-blue-300">Shop hub</span>
        </div>
      </div>
    </header>
  );
}
