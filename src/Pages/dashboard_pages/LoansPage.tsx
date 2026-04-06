import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { FaChevronDown, FaChevronUp } from "react-icons/fa6";
import { useAppSelector } from "../../Redux/hooks";
import * as api from "../../services/salaanApi";
import type { Accessory, Laptop, Selling, SellingLoanPayment } from "../../types/domain";
import PageHeader from "./PageHeader";
import {
  btnPrimary,
  cardClass,
  inputClass,
  tableWrap,
  tdClass,
  thClass,
} from "./dashboardUi";

function parseMoney(v: string): number {
  const n = Number.parseFloat(v.replace(/[^0-9.-]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function netSale(row: Selling): number {
  return Math.max(0, parseMoney(row.price) - parseMoney(row.discount));
}

function sumLoanPayments(payments: SellingLoanPayment[] | undefined): number {
  return (payments ?? []).reduce((s, x) => s + parseMoney(x.amount), 0);
}

function isLoanSale(row: Selling): boolean {
  return (row.payment_method ?? "").toLowerCase().trim() === "loan";
}

const COLLECT_METHODS: { value: string; label: string }[] = [
  { value: "cash", label: "Cash" },
  { value: "zaad", label: "Zaad" },
  { value: "e dahab", label: "e-Dahab" },
];

export default function LoansPage() {
  const userId = useAppSelector((s) => s.auth.user?.id);

  const [sellings, setSellings] = useState<Selling[]>([]);
  const [laptops, setLaptops] = useState<Laptop[]>([]);
  const [accessories, setAccessories] = useState<Accessory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState("cash");
  const [payNotes, setPayNotes] = useState("");
  const [paySaving, setPaySaving] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const [s, l, a] = await Promise.all([api.listSellings(), api.listLaptops(), api.listAccessories()]);
      setSellings(s.map((x) => ({ ...x, loanPayments: x.loanPayments ?? [] })));
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

  useEffect(() => {
    setPayAmount("");
    setPayMethod("cash");
    setPayNotes("");
  }, [expandedId]);

  const loanRows = useMemo(() => {
    return sellings.filter(isLoanSale).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [sellings]);

  /** Laptop-only loans (primary list). */
  const laptopLoanRows = useMemo(() => loanRows.filter((r) => r.laptop_id), [loanRows]);

  const totalOutstanding = useMemo(() => {
    return loanRows.reduce((sum, r) => {
      const bal = Math.max(0, netSale(r) - sumLoanPayments(r.loanPayments));
      return sum + bal;
    }, 0);
  }, [loanRows]);

  const pendingCount = useMemo(
    () => loanRows.filter((r) => (r.payment_status ?? "").toLowerCase() !== "fulfilled").length,
    [loanRows],
  );

  function labelItem(row: Selling): string {
    const lap = row.laptop_id ? laptops.find((x) => x.id === row.laptop_id) : undefined;
    const acc = row.accessory_id ? accessories.find((x) => x.id === row.accessory_id) : undefined;
    if (lap) return `Laptop: ${lap.name}`;
    if (acc) return `Accessory: ${acc.name}`;
    return "—";
  }

  async function handleAddPayment(sellingId: string) {
    if (!userId || !payAmount.trim()) return;
    setPaySaving(true);
    setError(null);
    try {
      await api.createSellingLoanPayment({
        selling_id: sellingId,
        amount: payAmount.trim(),
        user_id: userId,
        payment_method: payMethod,
        ...(payNotes.trim() ? { notes: payNotes.trim() } : {}),
      });
      setPayAmount("");
      setPayNotes("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not record payment");
    } finally {
      setPaySaving(false);
    }
  }

  async function handleDeletePayment(paymentId: string) {
    if (!window.confirm("Remove this customer payment?")) return;
    setError(null);
    try {
      await api.deleteSellingLoanPayment(paymentId);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  }

  function renderLoanTable(rows: Selling[], emptyMsg: string) {
    if (rows.length === 0) {
      return <p className="text-sm text-slate-500">{emptyMsg}</p>;
    }
    return (
      <div className={tableWrap}>
        <table className="w-full min-w-[720px] border-collapse">
          <thead>
            <tr>
              <th className={thClass}>Date</th>
              <th className={thClass}>Customer</th>
              <th className={thClass}>Item</th>
              <th className={thClass}>Net</th>
              <th className={thClass}>Paid</th>
              <th className={thClass}>Balance</th>
              <th className={thClass}>Status</th>
              <th className={`${thClass} w-28`}>Pay</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const net = netSale(row);
              const paid = sumLoanPayments(row.loanPayments);
              const balance = Math.max(0, net - paid);
              const st = (row.payment_status ?? "").toLowerCase();
              const fulfilled = st === "fulfilled";
              const isOpen = expandedId === row.id;

              return (
                <Fragment key={row.id}>
                  <tr>
                    <td className={`${tdClass} whitespace-nowrap text-xs text-slate-500`}>
                      {new Date(row.createdAt).toLocaleDateString()}
                    </td>
                    <td className={tdClass}>
                      <div className="text-sm font-medium">{row.customer_name}</div>
                      <div className="text-xs text-slate-500">{row.customer_phone}</div>
                    </td>
                    <td className={`${tdClass} text-sm`}>{labelItem(row)}</td>
                    <td className={`${tdClass} font-mono text-sm`}>{net.toFixed(2)}</td>
                    <td className={`${tdClass} font-mono text-sm`}>{paid.toFixed(2)}</td>
                    <td className={`${tdClass} font-mono text-sm font-semibold`}>{balance.toFixed(2)}</td>
                    <td className={tdClass}>
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                          fulfilled
                            ? "bg-emerald-100 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-200"
                            : "bg-amber-100 text-amber-900 dark:bg-amber-950/50 dark:text-amber-200"
                        }`}
                      >
                        {fulfilled ? "Paid off" : "Owing"}
                      </span>
                    </td>
                    <td className={tdClass}>
                      <button
                        type="button"
                        className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline dark:text-blue-400"
                        onClick={() => setExpandedId(isOpen ? null : row.id)}
                      >
                        {isOpen ? (
                          <>
                            <FaChevronUp className="h-3 w-3" /> Hide
                          </>
                        ) : (
                          <>
                            <FaChevronDown className="h-3 w-3" /> Pay
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                  {isOpen ? (
                    <tr className="bg-slate-50/90 dark:bg-slate-900/50">
                      <td colSpan={8} className="border-b border-slate-100 px-4 py-3 dark:border-slate-800">
                        <div className="grid gap-3 lg:grid-cols-2">
                          <div>
                            <h3 className="mb-1.5 text-xs font-bold uppercase tracking-wide text-slate-600 dark:text-slate-400">
                              Payments from customer
                            </h3>
                            {(row.loanPayments ?? []).length === 0 ? (
                              <p className="text-xs text-slate-500">No payments recorded yet.</p>
                            ) : (
                              <ul className="space-y-1.5">
                                {(row.loanPayments ?? []).map((pay) => (
                                  <li
                                    key={pay.id}
                                    className="flex flex-wrap items-center justify-between gap-2 rounded border border-slate-200/80 bg-white px-2.5 py-1.5 text-xs dark:border-slate-600 dark:bg-slate-800/50"
                                  >
                                    <span className="font-mono font-semibold">{pay.amount}</span>
                                    <span className="text-slate-500">
                                      {pay.payment_method ?? "—"} · {new Date(pay.paid_at).toLocaleString()}
                                    </span>
                                    <button
                                      type="button"
                                      className="font-bold text-red-600 hover:underline dark:text-red-400"
                                      onClick={() => void handleDeletePayment(pay.id)}
                                    >
                                      Remove
                                    </button>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                          <div className="rounded-lg border border-blue-200/80 bg-blue-50/80 p-2.5 dark:border-blue-900/40 dark:bg-blue-950/30">
                            <h3 className="mb-1.5 text-xs font-bold uppercase tracking-wide text-blue-900 dark:text-blue-200">
                              Record payment
                            </h3>
                            <div className="flex flex-col gap-1.5">
                              <input
                                className={inputClass}
                                placeholder="Amount"
                                value={payAmount}
                                onChange={(e) => setPayAmount(e.target.value)}
                              />
                              <select
                                className={inputClass}
                                value={payMethod}
                                onChange={(e) => setPayMethod(e.target.value)}
                              >
                                {COLLECT_METHODS.map((m) => (
                                  <option key={m.value} value={m.value}>
                                    {m.label}
                                  </option>
                                ))}
                              </select>
                              <input
                                className={inputClass}
                                placeholder="Note (optional)"
                                value={payNotes}
                                onChange={(e) => setPayNotes(e.target.value)}
                              />
                              <button
                                type="button"
                                className={`${btnPrimary} w-full justify-center py-2 text-xs`}
                                disabled={paySaving || !userId || fulfilled}
                                onClick={() => void handleAddPayment(row.id)}
                              >
                                {fulfilled
                                  ? "Loan closed"
                                  : paySaving
                                    ? "Saving…"
                                    : "Add customer payment"}
                              </button>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Customer loans"
        dense
        subtitle="Sales on loan (especially laptops): record each payment from the customer. When paid total reaches the net sale amount, status moves to Paid off. Accessory loans work the same."
      />

      {error ? (
        <div className="mb-3 rounded border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
          {error}
        </div>
      ) : null}

      <div className="mb-3 grid gap-2 sm:grid-cols-3">
        <div className={`${cardClass} !p-3`}>
          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Laptop loans
          </p>
          <p className="mt-0.5 text-xl font-bold text-slate-900 dark:text-white">{laptopLoanRows.length}</p>
        </div>
        <div className={`${cardClass} !p-3`}>
          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Not paid off
          </p>
          <p className="mt-0.5 text-xl font-bold text-amber-700 dark:text-amber-400">{pendingCount}</p>
        </div>
        <div className={`${cardClass} !p-3`}>
          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Total balance due
          </p>
          <p className="mt-0.5 text-xl font-bold text-slate-900 dark:text-white">{totalOutstanding.toFixed(2)}</p>
        </div>
      </div>

      <div className={`${cardClass} !p-3 sm:!p-4`}>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">Laptop loans</h2>
          <Link
            to="/dashboard/sales"
            className="text-xs font-semibold text-blue-600 hover:underline dark:text-blue-400"
          >
            Sales →
          </Link>
        </div>
        {loading ? (
          <p className="text-sm text-slate-500">Loading…</p>
        ) : (
          renderLoanTable(
            laptopLoanRows,
            "No laptop sales on loan yet. On Sales, sell a laptop with payment method Loan.",
          )
        )}
      </div>

      {loanRows.some((r) => !r.laptop_id) ? (
        <div className={`${cardClass} !p-3 sm:!p-4 mt-3`}>
          <h2 className="mb-2 text-base font-bold text-slate-900 dark:text-white">Other loans (accessories)</h2>
          {loading ? null : renderLoanTable(loanRows.filter((r) => !r.laptop_id), "No accessory loans.")}
        </div>
      ) : null}
    </div>
  );
}
