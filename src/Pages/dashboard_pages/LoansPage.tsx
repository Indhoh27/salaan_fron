import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import * as api from "../../services/salaanApi";
import type { Accessory, Laptop, Selling } from "../../types/domain";
import PageHeader from "./PageHeader";
import { cardClass, tableWrap, tdClass, thClass } from "./dashboardUi";

function parseMoney(v: string): number {
  const n = Number.parseFloat(v.replace(/[^0-9.-]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function netSale(row: Selling): number {
  return Math.max(0, parseMoney(row.price) - parseMoney(row.discount));
}

function isLoanSale(row: Selling): boolean {
  return (row.payment_method ?? "").toLowerCase().trim() === "loan";
}

export default function LoansPage() {
  const [sellings, setSellings] = useState<Selling[]>([]);
  const [laptops, setLaptops] = useState<Laptop[]>([]);
  const [accessories, setAccessories] = useState<Accessory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const [s, l, a] = await Promise.all([api.listSellings(), api.listLaptops(), api.listAccessories()]);
      setSellings(s);
      setLaptops(l);
      setAccessories(a);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load sales");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const loanRows = useMemo(() => {
    return sellings.filter(isLoanSale).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [sellings]);

  const pending = useMemo(
    () => loanRows.filter((r) => (r.payment_status ?? "").toLowerCase() !== "fulfilled"),
    [loanRows],
  );

  const totalOutstanding = useMemo(() => {
    return pending.reduce((sum, r) => sum + netSale(r), 0);
  }, [pending]);

  function labelItem(row: Selling): string {
    const lap = row.laptop_id ? laptops.find((x) => x.id === row.laptop_id) : undefined;
    const acc = row.accessory_id ? accessories.find((x) => x.id === row.accessory_id) : undefined;
    if (lap) return `Laptop: ${lap.name}`;
    if (acc) return `Accessory: ${acc.name}`;
    return "—";
  }

  return (
    <div>
      <PageHeader
        title="Customer loans"
        subtitle="Sales recorded with payment method “Loan”: the customer owes the shop. Pending means they have not finished paying; fulfilled means the loan is closed. Update status on the Sales page."
      />

      {error ? (
        <div className="mb-6 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
          {error}
        </div>
      ) : null}

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <div className={cardClass}>
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Loan sales</p>
          <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{loanRows.length}</p>
        </div>
        <div className={cardClass}>
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Pending (owe shop)</p>
          <p className="mt-1 text-2xl font-bold text-amber-700 dark:text-amber-400">{pending.length}</p>
        </div>
        <div className={cardClass}>
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Pending balance (net)
          </p>
          <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{totalOutstanding.toFixed(2)}</p>
        </div>
      </div>

      <div className={cardClass}>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">All loan sales</h2>
          <Link
            to="/dashboard/sales"
            className="text-sm font-semibold text-blue-600 hover:underline dark:text-blue-400"
          >
            Go to Sales →
          </Link>
        </div>
        {loading ? (
          <p className="text-sm text-slate-500">Loading…</p>
        ) : loanRows.length === 0 ? (
          <p className="text-sm text-slate-500">No sales on loan yet. Record a sale with payment method Loan on the Sales page.</p>
        ) : (
          <div className={tableWrap}>
            <table className="w-full min-w-[800px] border-collapse">
              <thead>
                <tr>
                  <th className={thClass}>Date</th>
                  <th className={thClass}>Customer</th>
                  <th className={thClass}>Item</th>
                  <th className={thClass}>Net amount</th>
                  <th className={thClass}>Status</th>
                </tr>
              </thead>
              <tbody>
                {loanRows.map((row) => {
                  const st = (row.payment_status ?? "").toLowerCase();
                  const isPending = st !== "fulfilled";
                  return (
                    <tr key={row.id}>
                      <td className={`${tdClass} whitespace-nowrap text-xs text-slate-500`}>
                        {new Date(row.createdAt).toLocaleString()}
                      </td>
                      <td className={tdClass}>
                        <div className="font-medium">{row.customer_name}</div>
                        <div className="text-xs text-slate-500">{row.customer_phone}</div>
                      </td>
                      <td className={tdClass}>{labelItem(row)}</td>
                      <td className={`${tdClass} font-mono text-sm`}>{netSale(row).toFixed(2)}</td>
                      <td className={tdClass}>
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide ${
                            isPending
                              ? "bg-amber-100 text-amber-900 dark:bg-amber-950/50 dark:text-amber-200"
                              : "bg-emerald-100 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-200"
                          }`}
                        >
                          {isPending ? "Pending" : "Fulfilled"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
