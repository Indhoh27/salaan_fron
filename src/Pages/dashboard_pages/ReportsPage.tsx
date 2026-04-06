import { useCallback, useEffect, useState } from "react";
import * as api from "../../services/salaanApi";
import type { IncomeExpenseReport, ReportPeriod } from "../../types/domain";
import PageHeader from "./PageHeader";
import { btnGhost, btnPrimary, cardClass, inputClass, labelClass, tableWrap, tdClass, thClass } from "./dashboardUi";

function todayYmd(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function ReportsPage() {

  const [period, setPeriod] = useState<ReportPeriod>("monthly");
  const [date, setDate] = useState(todayYmd);
  const [report, setReport] = useState<IncomeExpenseReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [pdfBusy, setPdfBusy] = useState(false);

  const fetchReport = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      setReport(await api.incomeExpenseReport({ period, date }));
    } catch (e) {
      setReport(null);
      setError(e instanceof Error ? e.message : "Failed to load report");
    } finally {
      setLoading(false);
    }
  }, [period, date]);

  useEffect(() => {
    void fetchReport();
  }, [fetchReport]);

  const fmt = (n: number) =>
    n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  async function handleDownloadPdf() {
    setPdfBusy(true);
    setError(null);
    try {
      await api.downloadIncomeExpensePdf({ period, date });
    } catch (e) {
      setError(e instanceof Error ? e.message : "PDF download failed");
    } finally {
      setPdfBusy(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Reports"
        subtitle="Income and expense summary. Export the same report as PDF."
      />

      <div className={`${cardClass} mb-6`}>
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[130px]">
            <label className={labelClass} htmlFor="rep-period">
              Period
            </label>
            <select
              id="rep-period"
              className={inputClass}
              value={period}
              onChange={(e) => setPeriod(e.target.value as ReportPeriod)}
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>
          <div className="min-w-[150px]">
            <label className={labelClass} htmlFor="rep-date">
              Anchor date
            </label>
            <input
              id="rep-date"
              type="date"
              className={inputClass}
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <button type="button" className={btnPrimary} onClick={() => void fetchReport()} disabled={loading}>
            {loading ? "Loading…" : "Refresh"}
          </button>
          <button
            type="button"
            className={btnGhost}
            onClick={() => void handleDownloadPdf()}
            disabled={pdfBusy}
          >
            {pdfBusy ? "PDF…" : "Download PDF"}
          </button>
        </div>
      </div>

      {error ? (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
          {error}
        </div>
      ) : null}

      {report ? (
        <>
          <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded border border-slate-200/90 bg-white/90 p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/50">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Income</p>
              <p className="mt-2 text-2xl font-bold text-emerald-600 dark:text-emerald-400">{fmt(report.income)}</p>
            </div>
            <div className="rounded border border-slate-200/90 bg-white/90 p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/50">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Expenses</p>
              <p className="mt-2 text-2xl font-bold text-amber-600 dark:text-amber-400">{fmt(report.expenses)}</p>
            </div>
            <div className="rounded border border-slate-200/90 bg-white/90 p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/50">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Profit</p>
              <p className="mt-2 text-2xl font-bold text-blue-600 dark:text-blue-400">{fmt(report.profit)}</p>
            </div>
            <div className="rounded border border-slate-200/90 bg-white/90 p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/50">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Range</p>
              <p className="mt-2 text-2xl font-bold capitalize text-slate-700 dark:text-slate-200">{report.period}</p>
              <p className="mt-1 text-xs text-slate-500">
                {new Date(report.start).toLocaleDateString()} → {new Date(report.endExclusive).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="mb-8 grid gap-4 md:grid-cols-2">
            <div className={cardClass}>
              <h3 className="mb-3 font-bold text-slate-900 dark:text-white">Income breakdown</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Sellings</span>
                  <span className="font-semibold">{fmt(report.incomeBreakdown.sellings)}</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Jobs</span>
                  <span className="font-semibold">{fmt(report.incomeBreakdown.jobs)}</span>
                </li>
              </ul>
            </div>
            <div className={cardClass}>
              <h3 className="mb-3 font-bold text-slate-900 dark:text-white">Expense breakdown</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Purchase payments</span>
                  <span className="font-semibold">{fmt(report.expenseBreakdown.purchasePayments)}</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Other expenses</span>
                  <span className="font-semibold">{fmt(report.expenseBreakdown.otherExpenses)}</span>
                </li>
              </ul>
            </div>
          </div>

          <div className={cardClass}>
            <h3 className="mb-4 font-bold text-slate-900 dark:text-white">By day</h3>
            {report.breakdown.length === 0 ? (
              <p className="text-sm text-slate-500">No activity in this range.</p>
            ) : (
              <div className={tableWrap}>
                <table className="w-full min-w-[480px] border-collapse">
                  <thead>
                    <tr>
                      <th className={thClass}>Day</th>
                      <th className={thClass}>Income</th>
                      <th className={thClass}>Expense</th>
                      <th className={thClass}>Profit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.breakdown.map((row) => (
                      <tr key={row.day}>
                        <td className={tdClass}>{row.day}</td>
                        <td className={tdClass}>{fmt(row.income)}</td>
                        <td className={tdClass}>{fmt(row.expense)}</td>
                        <td className={`${tdClass} font-semibold`}>{fmt(row.profit)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}
