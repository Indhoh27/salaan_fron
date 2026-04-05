import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FaArrowTrendUp,
  FaBolt,
  FaCircleCheck,
  FaClock,
  FaScrewdriverWrench,
  FaWandSparkles,
} from "react-icons/fa6";
import { useAppSelector } from "../../Redux/hooks";
import * as api from "../../services/salaanApi";

const quickTiles = [
  {
    title: "New job",
    subtitle: "Intake a repair",
    to: "/dashboard/jobs",
    color: "bg-blue-600 hover:bg-blue-500",
  },
  {
    title: "Record sale",
    subtitle: "Laptop or accessory",
    to: "/dashboard/sales",
    color: "bg-indigo-600 hover:bg-indigo-500",
  },
  {
    title: "Add expense",
    subtitle: "Track overhead",
    to: "/dashboard/expenses",
    color: "bg-slate-700 hover:bg-slate-600 dark:bg-slate-600 dark:hover:bg-slate-500",
  },
];

export default function Mainpage() {
  const user = useAppSelector((s) => s.auth.user);
  const firstName = user?.fullName?.split(/\s+/)[0] ?? user?.email?.split("@")[0] ?? "there";

  const [jobCount, setJobCount] = useState<number | null>(null);
  const [sellingCount, setSellingCount] = useState<number | null>(null);
  const [dailyIncome, setDailyIncome] = useState<number | null>(null);
  const [openJobs, setOpenJobs] = useState<number | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const ymd = new Date().toISOString().slice(0, 10);
    (async () => {
      try {
        const [jobs, sellings, report] = await Promise.all([
          api.listJobs(),
          api.listSellings(),
          api.incomeExpenseReport({ period: "daily", date: ymd }),
        ]);
        if (cancelled) return;
        setJobCount(jobs.length);
        setSellingCount(sellings.length);
        setDailyIncome(report.income);
        setOpenJobs(jobs.filter((j) => !j.is_completed).length);
        setLoadError(null);
      } catch {
        if (!cancelled) {
          setLoadError("Could not refresh live stats (is the API running?)");
          setJobCount(null);
          setSellingCount(null);
          setDailyIncome(null);
          setOpenJobs(null);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const fmtMoney = (n: number | null) =>
    n === null ? "—" : n.toLocaleString(undefined, { style: "currency", currency: "USD" });

  const stats = [
    {
      label: "Jobs on file",
      value: jobCount === null ? "—" : String(jobCount),
      hint: loadError ? "API offline?" : "All active jobs",
      icon: FaScrewdriverWrench,
      accent: "from-blue-500 to-indigo-600",
      ring: "ring-blue-500/20",
    },
    {
      label: "Sales lines",
      value: sellingCount === null ? "—" : String(sellingCount),
      hint: "Total selling records",
      icon: FaArrowTrendUp,
      accent: "from-emerald-500 to-teal-600",
      ring: "ring-emerald-500/20",
    },
    {
      label: "Open repairs",
      value: openJobs === null ? "—" : String(openJobs),
      hint: "Not marked complete",
      icon: FaCircleCheck,
      accent: "from-violet-500 to-purple-600",
      ring: "ring-violet-500/20",
    },
    {
      label: "Income (today)",
      value: fmtMoney(dailyIncome),
      hint: "From /reports/income-expense daily",
      icon: FaClock,
      accent: "from-amber-500 to-orange-600",
      ring: "ring-amber-500/20",
    },
  ];

  return (
    <div className="space-y-10">
      <section className="relative overflow-hidden rounded border border-slate-200/80 bg-gradient-to-br from-blue-600 via-blue-600 to-indigo-700 p-8 text-white shadow-xl shadow-blue-600/20 dark:border-blue-500/20 dark:shadow-blue-900/30 sm:p-10">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              "radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)",
            backgroundSize: "24px 24px",
          }}
        />
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-16 left-1/4 h-48 w-48 rounded-full bg-indigo-400/20 blur-3xl" />

        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider backdrop-blur-sm">
              <FaWandSparkles className="h-3.5 w-3.5" aria-hidden />
              Dashboard
            </span>
            <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl lg:text-[2.5rem] lg:leading-tight">
              Hey {firstName}, your shop looks sharp today.
            </h1>
            <p className="mt-3 max-w-xl text-sm font-light leading-relaxed text-white/90 sm:text-base">
              Live counts below come from your backend. Use the sidebar for full CRUD screens.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-3 rounded border border-white/20 bg-white/10 px-5 py-4 backdrop-blur-md">
            <div className="flex h-12 w-12 items-center justify-center rounded bg-white/20">
              <FaBolt className="h-6 w-6 text-amber-200" aria-hidden />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-white/70">Pulse</p>
              <p className="text-lg font-bold">{loadError ? "Check API" : "All systems go"}</p>
            </div>
          </div>
        </div>
      </section>

      {loadError ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
          {loadError}
        </div>
      ) : null}

      <section>
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Live snapshot</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Refreshes when you open this page.</p>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((s) => {
            const Icon = s.icon;
            return (
              <article
                key={s.label}
                className="group relative overflow-hidden rounded border border-slate-200/90 bg-white/90 p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200/80 hover:shadow-md dark:border-slate-700/60 dark:bg-slate-900/60 dark:hover:border-blue-500/30"
              >
                <div
                  className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded bg-gradient-to-br ${s.accent} text-white shadow-lg ring-2 ${s.ring}`}
                >
                  <Icon className="h-5 w-5" aria-hidden />
                </div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {s.label}
                </p>
                <p className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{s.value}</p>
                <p className="mt-2 text-xs font-medium text-blue-600 dark:text-blue-400">{s.hint}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="grid gap-3 lg:grid-cols-[1fr,minmax(0,20rem)]">
        <div className="rounded border border-slate-200/90 bg-white/80 p-6 shadow-sm backdrop-blur-sm dark:border-slate-700/60 dark:bg-slate-900/50">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Quick actions</h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Jump to working pages.</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {quickTiles.map((t) => (
              <Link
                key={t.title}
                to={t.to}
                className={`rounded px-4 py-4 text-left text-white shadow-lg transition ${t.color} focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50`}
              >
                <p className="font-bold">{t.title}</p>
                <p className="mt-1 text-xs font-medium text-white/85">{t.subtitle}</p>
              </Link>
            ))}
          </div>
        </div>

        <div className="rounded border border-dashed border-slate-300/90 bg-slate-50/80 p-6 dark:border-slate-600 dark:bg-slate-800/40">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">More</h3>
          <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
            <Link className="font-semibold text-blue-600 hover:underline dark:text-blue-400" to="/dashboard/reports">
              Reports
            </Link>
            ,{" "}
            <Link className="font-semibold text-blue-600 hover:underline dark:text-blue-400" to="/dashboard/inventory">
              inventory
            </Link>
            , and{" "}
            <Link className="font-semibold text-blue-600 hover:underline dark:text-blue-400" to="/dashboard/settings">
              settings
            </Link>{" "}
            are wired to the API.
          </p>
        </div>
      </section>
    </div>
  );
}
