import { useEffect, useMemo, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  FaChartPie,
  FaScrewdriverWrench,
  FaLaptop,
  FaCartShopping,
  FaChartLine,
  FaGear,
  FaRightFromBracket,
  FaMoon,
  FaSun,
  FaReceipt,
  FaUsers,
  FaHandHoldingDollar,
  FaFileInvoiceDollar,
  FaCircleUser,
} from "react-icons/fa6";
import { useAppDispatch, useAppSelector } from "../../Redux/hooks";
import { logoutUser } from "../../Redux/authSlice";

type Theme = "light" | "dark";

type NavItem = {
  kind: "link";
  label: string;
  icon: typeof FaChartPie;
  to: string;
  end?: boolean;
  adminOnly?: boolean;
};

const navItems: NavItem[] = [
  { kind: "link", label: "Overview", icon: FaChartPie, to: "/dashboard", end: true },
  { kind: "link", label: "Jobs & repairs", icon: FaScrewdriverWrench, to: "/dashboard/jobs" },
  { kind: "link", label: "Inventory", icon: FaLaptop, to: "/dashboard/inventory" },
  { kind: "link", label: "Sales", icon: FaCartShopping, to: "/dashboard/sales" },
  { kind: "link", label: "Buying", icon: FaHandHoldingDollar, to: "/dashboard/buying" },
  { kind: "link", label: "Customer loans", icon: FaFileInvoiceDollar, to: "/dashboard/loans" },
  { kind: "link", label: "Expenses", icon: FaReceipt, to: "/dashboard/expenses" },
  { kind: "link", label: "Reports", icon: FaChartLine, to: "/dashboard/reports" },
  { kind: "link", label: "Users", icon: FaUsers, to: "/dashboard/users", adminOnly: true },
  { kind: "link", label: "Settings", icon: FaGear, to: "/dashboard/settings" },
];

const linkBase =
  "group flex items-center gap-3 rounded px-3 py-2.5 text-sm font-semibold tracking-wide transition-all duration-200";
const linkIdle =
  "text-slate-600 hover:bg-white/80 hover:text-blue-600 hover:shadow-sm dark:text-slate-400 dark:hover:bg-slate-800/80 dark:hover:text-blue-400";
const linkActive =
  "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/25 dark:shadow-blue-900/40";

type SidebarProps = {
  /** Close mobile drawer after navigation */
  onNavigate?: () => void;
};

export default function Sidebar({ onNavigate }: SidebarProps) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const user = useAppSelector((s) => s.auth.user);

  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const saved = localStorage.getItem("salaan_theme") as Theme | null;
    if (saved === "light" || saved === "dark") {
      setTheme(saved);
      return;
    }
    setTheme(window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("salaan_theme", theme);
  }, [theme]);

  const isDark = useMemo(() => theme === "dark", [theme]);
  const displayName = user?.fullName?.trim() || user?.email || "User";
  const displayRole = user?.role === "ADMIN" ? "Administrator" : "Staff";
  const avatarSeed = displayName.replace(/\s+/g, " ").trim();
  const avatarInitial = avatarSeed.charAt(0).toUpperCase() || "U";

  const handleLogout = async () => {
    onNavigate?.();
    try {
      await dispatch(logoutUser()).unwrap();
    } catch {
      /* still leave app */
    }
    navigate("/login", { replace: true });
  };

  return (
    <aside className="flex h-full w-full flex-col border-r border-slate-200/80 bg-gradient-to-b from-white via-slate-50/95 to-white shadow-[4px_0_24px_-8px_rgba(37,99,235,0.12)] dark:border-slate-700/60 dark:from-slate-900 dark:via-slate-900/98 dark:to-slate-950 dark:shadow-[4px_0_32px_-8px_rgba(0,0,0,0.5)]">
      <div className="flex items-center gap-3 border-b border-slate-200/70 px-5 py-4 dark:border-slate-700/60">
        <div className="flex h-9 w-9 items-center justify-center rounded bg-gradient-to-br from-blue-600 to-indigo-600 text-md font-bold text-white shadow-lg shadow-blue-600/30">
          S
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-bold tracking-tight text-slate-900 dark:text-white">
            Salaan Solution
          </p>
          <p className="truncate text-left  text-xs font-medium text-blue-600 dark:text-blue-400">Mgt System</p>
        </div>
        <button
          type="button"
          onClick={() => setTheme(isDark ? "light" : "dark")}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded border border-slate-200/90 bg-white text-slate-600 shadow-sm transition hover:border-blue-300 hover:text-blue-600 dark:border-slate-600 dark:bg-slate-800 dark:text-amber-200 dark:hover:border-amber-400/40"
          aria-label="Toggle theme"
        >
          {isDark ? <FaSun className="h-4 w-4" /> : <FaMoon className="h-4 w-4" />}
        </button>
      </div>

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-5">
        <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
          Menu
        </p>
        {navItems
          .filter((item) => !item.adminOnly || user?.role === "ADMIN")
          .map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => onNavigate?.()}
              className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkIdle}`}
            >
              <Icon
                className="h-[18px] w-[18px] shrink-0 transition-transform duration-200 group-hover:scale-110"
                aria-hidden
              />
              {item.label}
            </NavLink>
          );
        })}
      </nav>

      <div className="border-t border-slate-200/70 p-4 dark:border-slate-700/60">
        <div className="mb-3 rounded border border-slate-200/80 bg-gradient-to-br from-white to-slate-50 p-3 shadow-sm dark:border-slate-700/50 dark:from-slate-800/80 dark:to-slate-900/70">
          <div className="flex items-center gap-3">
            <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-sm font-bold text-white shadow-md shadow-blue-600/30">
              {avatarInitial}
              <FaCircleUser className="pointer-events-none absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-white text-blue-600 dark:bg-slate-900 dark:text-blue-300" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{displayName}</p>
              <div className="mt-1 flex items-center gap-2">
                <span className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-blue-700 dark:border-blue-800/60 dark:bg-blue-950/50 dark:text-blue-300">
                  {displayRole}
                </span>
                {user?.email ? (
                  <span className="truncate text-[11px] text-slate-500 dark:text-slate-400">{user.email}</span>
                ) : null}
              </div>
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center justify-center gap-2 rounded border border-red-200/90 bg-red-50/90 py-2.5 text-sm font-bold text-red-700 transition hover:bg-red-100 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300 dark:hover:bg-red-950/60"
        >
          <FaRightFromBracket className="h-4 w-4" aria-hidden />
          Log out
        </button>
      </div>
    </aside>
  );
}
