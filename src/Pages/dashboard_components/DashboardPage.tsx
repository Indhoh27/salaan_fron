import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAppSelector } from "../../Redux/hooks";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

export default function DashboardPage() {
  const user = useAppSelector((s) => s.auth.user);
  const restorePending = useAppSelector((s) => s.auth.restorePending);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    if (!mobileNavOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileNavOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [mobileNavOpen]);

  if (restorePending) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-sm font-medium text-slate-600 dark:bg-slate-950 dark:text-slate-400">
        Checking session…
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex min-h-screen flex-col font-sans md:flex-row">
      <div className="sticky top-0 z-30 hidden h-screen w-[17rem] shrink-0 md:block lg:w-[18.5rem]">
        <Sidebar />
      </div>

      <div
        className={`fixed inset-0 z-40 md:hidden ${mobileNavOpen ? "pointer-events-auto" : "pointer-events-none"}`}
        aria-hidden={!mobileNavOpen}
      >
        <button
          type="button"
          className={`absolute inset-0 bg-slate-900/45 backdrop-blur-[2px] transition-opacity duration-300 ${
            mobileNavOpen ? "opacity-100" : "opacity-0"
          }`}
          onClick={() => setMobileNavOpen(false)}
          aria-label="Close menu"
        />
        <div
          className={`absolute left-0 top-0 flex h-full w-[min(19rem,92vw)] max-w-full shadow-2xl shadow-slate-900/20 transition-transform duration-300 ease-out dark:shadow-black/40 ${
            mobileNavOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <Sidebar onNavigate={() => setMobileNavOpen(false)} />
        </div>
      </div>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col md:min-h-screen">
        <Navbar onMenuClick={() => setMobileNavOpen(true)} />
        <main className="relative min-h-0 flex-1 overflow-x-hidden">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(37,99,235,0.08),transparent)] dark:bg-[radial-gradient(ellipse_70%_40%_at_80%_0%,rgba(37,99,235,0.12),transparent)]" />
          <div className="relative z-10 mx-auto max-w-7xl px-4 py-2 sm:px-6 lg:px-4 lg:py-4">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
