import { useCallback, useEffect, useMemo, useState } from "react";
import { FaCheck, FaPenToSquare, FaTrash, FaXmark } from "react-icons/fa6";
import { useAppSelector } from "../../Redux/hooks";
import * as api from "../../services/salaanApi";
import type { Accessory, Laptop, Selling } from "../../types/domain";
import PageHeader from "./PageHeader";
import {
  btnDanger,
  btnEdit,
  btnPrimary,
  cardClass,
  inputClass,
  labelClass,
  tableInputClass,
  tableWrap,
  tdClass,
  thClass,
} from "./dashboardUi";

type LineKind = "laptop" | "accessory";

const PAYMENT_STATUSES: { value: string; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "fulfilled", label: "Fulfilled" },
];

const PAYMENT_STATUS_SET = new Set(PAYMENT_STATUSES.map((s) => s.value));

function paymentStatusLabel(value: string): string {
  return PAYMENT_STATUSES.find((s) => s.value === value)?.label ?? value;
}

function PaymentStatusSelect({
  value,
  onChange,
  className,
  id,
  required: req = true,
}: {
  value: string;
  onChange: (v: string) => void;
  className: string;
  id?: string;
  required?: boolean;
}) {
  const legacy = Boolean(value && !PAYMENT_STATUS_SET.has(value));
  return (
    <select
      id={id}
      className={className}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required={req}
    >
      {legacy ? (
        <option value={value}>
          {value} (other)
        </option>
      ) : null}
      {PAYMENT_STATUSES.map((s) => (
        <option key={s.value} value={s.value}>
          {s.label}
        </option>
      ))}
    </select>
  );
}

/** Sales methods: same as jobs plus loan. */
const SALES_PAYMENT_METHODS: { value: string; label: string }[] = [
  { value: "cash", label: "Cash" },
  { value: "zaad", label: "Zaad" },
  { value: "e dahab", label: "e-Dahab" },
  { value: "loan", label: "Loan" },
];

const SALES_PAYMENT_METHOD_SET = new Set(SALES_PAYMENT_METHODS.map((m) => m.value));

function salesPaymentMethodLabel(value: string): string {
  return SALES_PAYMENT_METHODS.find((m) => m.value === value)?.label ?? value;
}

function SalesPaymentMethodSelect({
  value,
  onChange,
  className,
  id,
  required: req = true,
}: {
  value: string;
  onChange: (v: string) => void;
  className: string;
  id?: string;
  required?: boolean;
}) {
  const legacy = Boolean(value && !SALES_PAYMENT_METHOD_SET.has(value));
  return (
    <select
      id={id}
      className={className}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required={req}
    >
      {legacy ? (
        <option value={value}>
          {value} (other)
        </option>
      ) : null}
      {SALES_PAYMENT_METHODS.map((m) => (
        <option key={m.value} value={m.value}>
          {m.label}
        </option>
      ))}
    </select>
  );
}

type SellingDraft = {
  price: string;
  discount: string;
  customer_name: string;
  customer_phone: string;
  payment_status: string;
  payment_method: string;
};

export default function SalesPage() {
  const userId = useAppSelector((s) => s.auth.user?.id);

  const [sellings, setSellings] = useState<Selling[]>([]);
  const [laptops, setLaptops] = useState<Laptop[]>([]);
  const [accessories, setAccessories] = useState<Accessory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [kind, setKind] = useState<LineKind>("laptop");
  const [lineId, setLineId] = useState("");
  const [price, setPrice] = useState("");
  const [discount, setDiscount] = useState("0");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("pending");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [saving, setSaving] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<SellingDraft | null>(null);
  const [editSaving, setEditSaving] = useState(false);

  const laptopOptions = useMemo(
    () => laptops.filter((l) => l.is_available !== false),
    [laptops],
  );
  const accessoryOptions = useMemo(
    () => accessories.filter((a) => (a.quantity ?? 0) > 0),
    [accessories],
  );

  const selectedLineItem = useMemo((): Laptop | Accessory | null => {
    if (!lineId) return null;
    if (kind === "laptop") return laptops.find((l) => l.id === lineId) ?? null;
    return accessories.find((a) => a.id === lineId) ?? null;
  }, [lineId, kind, laptops, accessories]);

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const [s, l, a] = await Promise.all([api.listSellings(), api.listLaptops(), api.listAccessories()]);
      setSellings(s);
      setLaptops(l);
      setAccessories(a);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load sales data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    setLineId("");
    setPrice("");
    setDiscount("0");
  }, [kind]);

  useEffect(() => {
    const pool = kind === "laptop" ? laptopOptions : accessoryOptions;
    if (lineId && !pool.some((x) => x.id === lineId)) {
      setLineId("");
      setPrice("");
      setDiscount("0");
    }
  }, [kind, lineId, laptopOptions, accessoryOptions]);

  function applyInventoryPricing(id: string) {
    if (!id) {
      setPrice("");
      setDiscount("0");
      return;
    }
    const item =
      kind === "laptop" ? laptops.find((l) => l.id === id) : accessories.find((a) => a.id === id);
    if (item) {
      setPrice(item.price);
      const d = item.discount?.trim();
      setDiscount(d && Number(d) > 0 ? d : "0");
    }
  }

  async function removeSelling(id: string) {
    if (!window.confirm("Remove this sale line?")) return;
    setError(null);
    try {
      await api.deleteSelling(id);
      if (editingId === id) {
        setEditingId(null);
        setEditDraft(null);
      }
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  }

  function labelForSelling(row: Selling): string {
    const lap = row.laptop_id ? laptops.find((x) => x.id === row.laptop_id) : undefined;
    const acc = row.accessory_id ? accessories.find((x) => x.id === row.accessory_id) : undefined;
    if (lap) return `Laptop: ${lap.name}`;
    if (acc) return `Accessory: ${acc.name}`;
    return "—";
  }

  function startEdit(row: Selling) {
    setEditingId(row.id);
    setEditDraft({
      price: row.price,
      discount: row.discount,
      customer_name: row.customer_name,
      customer_phone: row.customer_phone,
      payment_status: row.payment_status ?? "pending",
      payment_method: row.payment_method ?? "cash",
    });
  }

  async function saveEdit(row: Selling) {
    if (!editingId || !editDraft) return;
    setEditSaving(true);
    setError(null);
    try {
      await api.updateSelling(editingId, {
        price: editDraft.price,
        discount: editDraft.discount,
        customer_name: editDraft.customer_name,
        customer_phone: editDraft.customer_phone,
        payment_status: editDraft.payment_status,
        payment_method: editDraft.payment_method,
        user_id: row.user_id,
        laptop_id: row.laptop_id ?? undefined,
        accessory_id: row.accessory_id ?? undefined,
      });
      setEditingId(null);
      setEditDraft(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setEditSaving(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!userId || !lineId) {
      setError(kind === "laptop" ? "Pick a laptop" : "Pick an accessory");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await api.createSelling({
        price,
        discount,
        customer_name: customerName,
        customer_phone: customerPhone,
        payment_status: paymentStatus,
        payment_method: paymentMethod,
        user_id: userId,
        laptop_id: kind === "laptop" ? lineId : null,
        accessory_id: kind === "accessory" ? lineId : null,
      });
      setPrice("");
      setDiscount("0");
      setCustomerName("");
      setCustomerPhone("");
      setLineId("");
      setPaymentStatus("pending");
      setPaymentMethod("cash");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not record sale");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Sales"
        subtitle="Only available laptops and in-stock accessories appear here. Selling a laptop marks it unavailable; each accessory sale reduces quantity by 1 (restored if you remove the sale line)."
      />

      {error ? (
        <div className="mb-6 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[1fr,minmax(300px,400px)]">
        <div className={cardClass}>
          <h2 className="mb-4 text-lg font-bold text-slate-900 dark:text-white">Recent sales</h2>
          {loading ? (
            <p className="text-sm text-slate-500">Loading…</p>
          ) : sellings.length === 0 ? (
            <p className="text-sm text-slate-500">No sales recorded.</p>
          ) : (
            <div className={tableWrap}>
              <table className="w-full min-w-[860px] border-collapse">
                <thead>
                  <tr>
                    <th className={thClass}>Item</th>
                    <th className={thClass}>Customer</th>
                    <th className={thClass}>Price / disc.</th>
                    <th className={thClass}>Payment</th>
                    <th className={`${thClass} w-28 text-right`}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sellings.map((row) => {
                    const isEd = editingId === row.id && editDraft;
                    return (
                      <tr key={row.id}>
                        <td className={tdClass}>{labelForSelling(row)}</td>
                        <td className={tdClass}>
                          {isEd ? (
                            <div className="space-y-1">
                              <input
                                className={tableInputClass}
                                value={editDraft!.customer_name}
                                onChange={(e) =>
                                  setEditDraft((d) => (d ? { ...d, customer_name: e.target.value } : d))
                                }
                              />
                              <input
                                className={tableInputClass}
                                value={editDraft!.customer_phone}
                                onChange={(e) =>
                                  setEditDraft((d) => (d ? { ...d, customer_phone: e.target.value } : d))
                                }
                              />
                            </div>
                          ) : (
                            <>
                              <div className="font-medium">{row.customer_name}</div>
                              <div className="text-xs text-slate-500">{row.customer_phone}</div>
                            </>
                          )}
                        </td>
                        <td className={tdClass}>
                          {isEd ? (
                            <div className="flex gap-1">
                              <input
                                className={tableInputClass}
                                value={editDraft!.price}
                                onChange={(e) =>
                                  setEditDraft((d) => (d ? { ...d, price: e.target.value } : d))
                                }
                              />
                              <input
                                className={tableInputClass}
                                value={editDraft!.discount}
                                onChange={(e) =>
                                  setEditDraft((d) => (d ? { ...d, discount: e.target.value } : d))
                                }
                              />
                            </div>
                          ) : (
                            <>
                              {row.price}
                              {Number(row.discount) > 0 ? (
                                <span className="ml-1 text-xs text-emerald-600 dark:text-emerald-400">
                                  −{row.discount}
                                </span>
                              ) : null}
                            </>
                          )}
                        </td>
                        <td className={tdClass}>
                          {isEd ? (
                            <div className="space-y-1">
                              <PaymentStatusSelect
                                className={tableInputClass}
                                value={editDraft!.payment_status}
                                onChange={(v) =>
                                  setEditDraft((d) => (d ? { ...d, payment_status: v } : d))
                                }
                              />
                              <SalesPaymentMethodSelect
                                className={tableInputClass}
                                value={editDraft!.payment_method}
                                onChange={(v) =>
                                  setEditDraft((d) => (d ? { ...d, payment_method: v } : d))
                                }
                              />
                            </div>
                          ) : (
                            <>
                              <div className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                                {paymentStatusLabel(row.payment_status ?? "pending")}
                              </div>
                              <div className="text-xs text-slate-500">
                                {salesPaymentMethodLabel(row.payment_method ?? "cash")}
                              </div>
                            </>
                          )}
                        </td>
                        <td className={`${tdClass} text-right`}>
                          <div className="flex flex-wrap justify-end gap-1">
                            {isEd ? (
                              <>
                                <button
                                  type="button"
                                  className={btnEdit}
                                  title="Save"
                                  disabled={editSaving}
                                  onClick={() => void saveEdit(row)}
                                >
                                  <FaCheck className="h-4 w-4 text-emerald-600" />
                                </button>
                                <button
                                  type="button"
                                  className={btnDanger}
                                  title="Cancel"
                                  onClick={() => {
                                    setEditingId(null);
                                    setEditDraft(null);
                                  }}
                                >
                                  <FaXmark className="h-4 w-4" />
                                </button>
                              </>
                            ) : (
                              <>
                                <button type="button" className={btnEdit} title="Edit" onClick={() => startEdit(row)}>
                                  <FaPenToSquare className="h-4 w-4" />
                                </button>
                                <button
                                  type="button"
                                  className={btnDanger}
                                  onClick={() => void removeSelling(row.id)}
                                  title="Remove"
                                >
                                  <FaTrash className="h-4 w-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <form onSubmit={(e) => void handleCreate(e)} className={`${cardClass} h-fit space-y-4`}>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">New sale</h2>
          <div className="flex gap-2">
            {(["laptop", "accessory"] as const).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setKind(k)}
                className={`flex-1 rounded py-2 text-sm font-bold capitalize ${
                  kind === k
                    ? "bg-blue-600 text-white"
                    : "border border-slate-200 bg-white text-slate-600 dark:border-slate-600 dark:bg-slate-800"
                }`}
              >
                {k}
              </button>
            ))}
          </div>
          <div>
            <label className={labelClass}>{kind === "laptop" ? "Laptop" : "Accessory"}</label>
            <select
              className={inputClass}
              value={lineId}
              onChange={(e) => {
                const id = e.target.value;
                setLineId(id);
                applyInventoryPricing(id);
              }}
              required
            >
              <option value="">Select…</option>
              {(kind === "laptop" ? laptopOptions : accessoryOptions).map((x) => (
                <option key={x.id} value={x.id}>
                  {kind === "accessory" ? `${x.name} (qty ${(x as Accessory).quantity ?? 0})` : x.name}
                </option>
              ))}
            </select>
            {kind === "laptop" && laptopOptions.length === 0 ? (
              <p className="mt-2 text-xs text-amber-700 dark:text-amber-300">
                No laptops available for sale. Add one in Inventory or mark an existing unit as available.
              </p>
            ) : null}
            {kind === "accessory" && accessoryOptions.length === 0 ? (
              <p className="mt-2 text-xs text-amber-700 dark:text-amber-300">
                No accessories in stock. Add quantity in Inventory.
              </p>
            ) : null}
          </div>

          {selectedLineItem ? (
            <div className="rounded-lg border border-blue-200/90 bg-blue-50/95 px-3 py-2.5 text-xs leading-relaxed text-blue-950 dark:border-blue-500/35 dark:bg-blue-950/45 dark:text-blue-100">
              <p className="font-bold text-blue-800 dark:text-blue-200">From inventory</p>
              <p className="mt-1">
                List price <span className="font-mono font-semibold">{selectedLineItem.price}</span>
                {Number(selectedLineItem.discount) > 0 ? (
                  <>
                    {" "}
                    — you can apply up to{" "}
                    <span className="font-mono font-semibold">{selectedLineItem.discount}</span> discount (adjust the
                    discount field below).
                  </>
                ) : (
                  <> — no preset discount on this item; you can still add a discount manually.</>
                )}
              </p>
              {kind === "laptop" ? (
                <p className="mt-2 font-medium text-amber-900 dark:text-amber-200">
                  After you record this sale, this laptop is marked <strong>unavailable</strong> until you turn “Available
                  for sale” back on in Inventory.
                </p>
              ) : (
                <p className="mt-2 text-blue-900/90 dark:text-blue-100/90">
                  In stock: <strong>{(selectedLineItem as Accessory).quantity ?? 0}</strong> — after this sale, quantity
                  becomes <strong>{Math.max(0, ((selectedLineItem as Accessory).quantity ?? 0) - 1)}</strong>.
                </p>
              )}
            </div>
          ) : null}

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={labelClass}>Price</label>
              <input className={inputClass} value={price} onChange={(e) => setPrice(e.target.value)} required />
            </div>
            <div>
              <label className={labelClass}>Discount</label>
              <input className={inputClass} value={discount} onChange={(e) => setDiscount(e.target.value)} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={labelClass} htmlFor="sale-pay-st">
                Payment status
              </label>
              <PaymentStatusSelect
                id="sale-pay-st"
                className={inputClass}
                value={paymentStatus}
                onChange={setPaymentStatus}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="sale-pay-m">
                Payment method
              </label>
              <SalesPaymentMethodSelect
                id="sale-pay-m"
                className={inputClass}
                value={paymentMethod}
                onChange={setPaymentMethod}
              />
            </div>
          </div>
          <div>
            <label className={labelClass}>Customer</label>
            <input
              className={inputClass}
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              required
            />
          </div>
          <div>
            <label className={labelClass}>Phone</label>
            <input
              className={inputClass}
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              required
            />
          </div>
          <button type="submit" className={`${btnPrimary} w-full`} disabled={saving || !userId}>
            {saving ? "Saving…" : "Record sale"}
          </button>
        </form>
      </div>
    </div>
  );
}
