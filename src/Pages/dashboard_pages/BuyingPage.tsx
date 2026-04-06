import { Fragment, useCallback, useEffect, useState } from "react";
import { FaChevronDown, FaChevronUp, FaPenToSquare, FaTrash, FaXmark } from "react-icons/fa6";
import { useAppSelector } from "../../Redux/hooks";
import * as api from "../../services/salaanApi";
import type { Purchase, PurchasePayment } from "../../types/domain";
import PageHeader from "./PageHeader";
import {
  btnDanger,
  btnEdit,
  btnPrimary,
  inputClass,
  labelClass,
  tableInputClass,
  tableWrap,
} from "./dashboardUi";

function parseMoney(v: string): number {
  const n = Number.parseFloat(v.replace(/[^0-9.-]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function itemLabel(p: Purchase): string {
  if (p.laptop_name?.trim()) return `Laptop: ${p.laptop_name}`;
  if (p.accessory_name?.trim()) return `Accessory: ${p.accessory_name}`;
  if (p.item_description?.trim()) return p.item_description;
  return "—";
}

function sumPayments(payments: PurchasePayment[] | undefined): number {
  return (payments ?? []).reduce((s, x) => s + parseMoney(x.amount), 0);
}

const PAYOUT_METHODS: { value: string; label: string }[] = [
  { value: "cash", label: "Cash" },
  { value: "zaad", label: "Zaad" },
  { value: "e dahab", label: "e-Dahab" },
];

const PURCHASE_STATUSES = ["PENDING", "PARTIAL", "PAID", "CANCELLED"] as const;

type ItemKind = "laptop" | "accessory" | "other";

type PurchaseEditDraft = {
  seller_name: string;
  seller_phone: string;
  agreed_price: string;
  laptop_name: string;
  accessory_name: string;
  item_description: string;
  notes: string;
  status: string;
};

const buyCard =
  "rounded border border-slate-200/90 bg-white/90 p-3 shadow-sm dark:border-slate-700/70 dark:bg-slate-900/50 sm:p-4";

const buyTh =
  "border-b border-slate-200 bg-slate-50/90 px-2 py-1.5 text-left text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-400";

const buyTd =
  "border-b border-slate-100 px-2 py-1.5 text-xs text-slate-800 dark:border-slate-800 dark:text-slate-200";

function statusBadgeClass(status: string): string {
  const u = status.toUpperCase();
  if (u === "PAID")
    return "bg-emerald-100 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-200";
  if (u === "PARTIAL")
    return "bg-amber-100 text-amber-900 dark:bg-amber-950/50 dark:text-amber-200";
  if (u === "CANCELLED")
    return "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200";
  return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
}

export default function BuyingPage() {
  const userId = useAppSelector((s) => s.auth.user?.id);

  const [rows, setRows] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [itemKind, setItemKind] = useState<ItemKind>("laptop");
  const [sellerName, setSellerName] = useState("");
  const [sellerPhone, setSellerPhone] = useState("");
  const [laptopName, setLaptopName] = useState("");
  const [accessoryName, setAccessoryName] = useState("");
  const [itemDescription, setItemDescription] = useState("");
  const [agreedPrice, setAgreedPrice] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState("cash");
  const [payNotes, setPayNotes] = useState("");
  const [paySaving, setPaySaving] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<PurchaseEditDraft | null>(null);
  const [editSaving, setEditSaving] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const list = await api.listPurchases();
      setRows(list.map((p) => ({ ...p, payments: p.payments ?? [] })));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load buying records");
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

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!userId) return;
    const body: Record<string, string | null | undefined> = {
      seller_name: sellerName,
      seller_phone: sellerPhone,
      agreed_price: agreedPrice,
      user_id: userId,
    };
    if (notes.trim()) body.notes = notes.trim();
    if (itemKind === "laptop") body.laptop_name = laptopName.trim();
    else if (itemKind === "accessory") body.accessory_name = accessoryName.trim();
    else body.item_description = itemDescription.trim();

    setSaving(true);
    setError(null);
    try {
      await api.createPurchase(body);
      setSellerName("");
      setSellerPhone("");
      setLaptopName("");
      setAccessoryName("");
      setItemDescription("");
      setAgreedPrice("");
      setNotes("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add record");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Remove this buying record and all its payments?")) return;
    setError(null);
    try {
      await api.deletePurchase(id);
      if (expandedId === id) setExpandedId(null);
      if (editingId === id) {
        setEditingId(null);
        setEditDraft(null);
      }
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  }

  async function handleAddPayment(purchaseId: string) {
    if (!userId || !payAmount.trim()) return;
    setPaySaving(true);
    setError(null);
    try {
      await api.createPurchasePayment({
        purchase_id: purchaseId,
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
    if (!window.confirm("Remove this payment?")) return;
    setError(null);
    try {
      await api.deletePurchasePayment(paymentId);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  }

  function startEdit(p: Purchase) {
    setEditingId(p.id);
    setEditDraft({
      seller_name: p.seller_name,
      seller_phone: p.seller_phone,
      agreed_price: p.agreed_price,
      laptop_name: p.laptop_name ?? "",
      accessory_name: p.accessory_name ?? "",
      item_description: p.item_description ?? "",
      notes: p.notes ?? "",
      status: p.status,
    });
  }

  async function saveEdit(p: Purchase) {
    if (!editingId || !editDraft) return;
    setEditSaving(true);
    setError(null);
    try {
      await api.updatePurchase(editingId, {
        seller_name: editDraft.seller_name,
        seller_phone: editDraft.seller_phone,
        agreed_price: editDraft.agreed_price,
        laptop_name: editDraft.laptop_name.trim() || undefined,
        accessory_name: editDraft.accessory_name.trim() || undefined,
        item_description: editDraft.item_description.trim() || undefined,
        notes: editDraft.notes.trim() || undefined,
        status: PURCHASE_STATUSES.includes(editDraft.status as (typeof PURCHASE_STATUSES)[number])
          ? editDraft.status
          : undefined,
        user_id: p.user_id,
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

  return (
    <div>
      <PageHeader
        title="Buying"
        dense
        subtitle="Shop buys from sellers; pay in parts. Status follows agreed vs paid. Add inventory on Inventory."
      />

      {error ? (
        <div className="mb-3 rounded border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
          {error}
        </div>
      ) : null}

      <div className="grid gap-2 xl:grid-cols-[1fr,minmax(240px,280px)]">
        <div className={buyCard}>
          <h2 className="mb-2 text-base font-bold text-slate-900 dark:text-white">Records</h2>
          {loading ? (
            <p className="text-sm text-slate-500">Loading…</p>
          ) : rows.length === 0 ? (
            <p className="text-sm text-slate-500">No purchases from sellers yet.</p>
          ) : (
            <div className={tableWrap}>
              <table className="w-full min-w-[680px] border-collapse">
                <thead>
                  <tr>
                    <th className={buyTh}>Seller</th>
                    <th className={buyTh}>Item</th>
                    <th className={buyTh}>Agreed</th>
                    <th className={buyTh}>Paid</th>
                    <th className={buyTh}>Left</th>
                    <th className={buyTh}>St</th>
                    <th className={`${buyTh} w-24`}>Pay</th>
                    <th className={`${buyTh} w-20 text-right`}>…</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((p) => {
                    const paid = sumPayments(p.payments);
                    const agreed = parseMoney(p.agreed_price);
                    const remaining = Math.max(0, agreed - paid);
                    const isEd = editingId === p.id && editDraft;
                    const isOpen = expandedId === p.id;

                    return (
                      <Fragment key={p.id}>
                        <tr>
                          <td className={buyTd}>
                            {isEd ? (
                              <div className="space-y-1">
                                <input
                                  className={tableInputClass}
                                  value={editDraft!.seller_name}
                                  onChange={(e) =>
                                    setEditDraft((d) => (d ? { ...d, seller_name: e.target.value } : d))
                                  }
                                />
                                <input
                                  className={tableInputClass}
                                  value={editDraft!.seller_phone}
                                  onChange={(e) =>
                                    setEditDraft((d) => (d ? { ...d, seller_phone: e.target.value } : d))
                                  }
                                />
                                <textarea
                                  className={`${tableInputClass} mt-1 min-h-[56px]`}
                                  placeholder="Notes"
                                  value={editDraft!.notes}
                                  onChange={(e) =>
                                    setEditDraft((d) => (d ? { ...d, notes: e.target.value } : d))
                                  }
                                />
                              </div>
                            ) : (
                              <>
                                <div className="font-medium">{p.seller_name}</div>
                                <div className="text-xs text-slate-500">{p.seller_phone}</div>
                              </>
                            )}
                          </td>
                          <td className={buyTd}>
                            {isEd ? (
                              <div className="space-y-1">
                                <input
                                  className={tableInputClass}
                                  placeholder="Laptop"
                                  value={editDraft!.laptop_name}
                                  onChange={(e) =>
                                    setEditDraft((d) => (d ? { ...d, laptop_name: e.target.value } : d))
                                  }
                                />
                                <input
                                  className={tableInputClass}
                                  placeholder="Accessory"
                                  value={editDraft!.accessory_name}
                                  onChange={(e) =>
                                    setEditDraft((d) => (d ? { ...d, accessory_name: e.target.value } : d))
                                  }
                                />
                                <input
                                  className={tableInputClass}
                                  placeholder="Other description"
                                  value={editDraft!.item_description}
                                  onChange={(e) =>
                                    setEditDraft((d) => (d ? { ...d, item_description: e.target.value } : d))
                                  }
                                />
                              </div>
                            ) : (
                              itemLabel(p)
                            )}
                          </td>
                          <td className={buyTd}>
                            {isEd ? (
                              <input
                                className={tableInputClass}
                                value={editDraft!.agreed_price}
                                onChange={(e) =>
                                  setEditDraft((d) => (d ? { ...d, agreed_price: e.target.value } : d))
                                }
                              />
                            ) : (
                              p.agreed_price
                            )}
                          </td>
                          <td className={`${buyTd} font-mono`}>{paid.toFixed(2)}</td>
                          <td className={`${buyTd} font-mono`}>{remaining.toFixed(2)}</td>
                          <td className={buyTd}>
                            {isEd ? (
                              <select
                                className={tableInputClass}
                                value={editDraft!.status}
                                onChange={(e) =>
                                  setEditDraft((d) => (d ? { ...d, status: e.target.value } : d))
                                }
                              >
                                {PURCHASE_STATUSES.map((s) => (
                                  <option key={s} value={s}>
                                    {s}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <span
                                className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide ${statusBadgeClass(p.status)}`}
                              >
                                {p.status}
                              </span>
                            )}
                          </td>
                          <td className={buyTd}>
                            <button
                              type="button"
                              className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline dark:text-blue-400"
                              onClick={() => setExpandedId(isOpen ? null : p.id)}
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
                          <td className={`${buyTd} text-right`}>
                            {isEd ? (
                              <div className="flex flex-wrap justify-end gap-1">
                                <button
                                  type="button"
                                  className={btnPrimary}
                                  disabled={editSaving}
                                  onClick={() => void saveEdit(p)}
                                >
                                  Save
                                </button>
                                <button
                                  type="button"
                                  className="rounded border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-600 dark:border-slate-600 dark:text-slate-300"
                                  onClick={() => {
                                    setEditingId(null);
                                    setEditDraft(null);
                                  }}
                                >
                                  <FaXmark className="inline h-3 w-3" />
                                </button>
                              </div>
                            ) : (
                              <div className="flex flex-wrap justify-end gap-1">
                                <button
                                  type="button"
                                  className={btnEdit}
                                  title="Edit"
                                  onClick={() => startEdit(p)}
                                >
                                  <FaPenToSquare />
                                </button>
                                <button
                                  type="button"
                                  className={btnDanger}
                                  title="Remove"
                                  onClick={() => void handleDelete(p.id)}
                                >
                                  <FaTrash />
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                        {isOpen ? (
                          <tr key={`${p.id}-detail`} className="bg-slate-50/90 dark:bg-slate-900/50">
                            <td colSpan={8} className="px-2 py-2 sm:px-3 sm:py-3">
                              <div className="grid gap-2 sm:gap-3 lg:grid-cols-2">
                                <div>
                                  <h3 className="mb-1 text-xs font-bold uppercase tracking-wide text-slate-600 dark:text-slate-400">
                                    Paid seller
                                  </h3>
                                  {(p.payments ?? []).length === 0 ? (
                                    <p className="text-xs text-slate-500">No payments yet.</p>
                                  ) : (
                                    <ul className="space-y-1.5 text-xs">
                                      {(p.payments ?? []).map((pay) => (
                                        <li
                                          key={pay.id}
                                          className="flex flex-wrap items-center justify-between gap-1.5 rounded border border-slate-200/80 bg-white px-2 py-1.5 dark:border-slate-600 dark:bg-slate-800/50"
                                        >
                                          <span className="font-mono font-semibold">{pay.amount}</span>
                                          <span className="text-xs text-slate-500">
                                            {pay.payment_method ?? "—"} ·{" "}
                                            {new Date(pay.paid_at).toLocaleString()}
                                          </span>
                                          <button
                                            type="button"
                                            className="text-xs font-bold text-red-600 hover:underline dark:text-red-400"
                                            onClick={() => void handleDeletePayment(pay.id)}
                                          >
                                            Remove
                                          </button>
                                        </li>
                                      ))}
                                    </ul>
                                  )}
                                </div>
                                <div className="rounded-lg border border-blue-200/80 bg-blue-50/80 p-2 sm:p-2.5 dark:border-blue-900/40 dark:bg-blue-950/30">
                                  <h3 className="mb-1 text-xs font-bold uppercase tracking-wide text-blue-900 dark:text-blue-200">
                                    Add payment
                                  </h3>
                                  <div className="flex flex-col gap-1.5">
                                    <input
                                      className={`${inputClass} py-2 text-xs`}
                                      placeholder="Amount"
                                      value={payAmount}
                                      onChange={(e) => setPayAmount(e.target.value)}
                                    />
                                    <select
                                      className={`${inputClass} py-2 text-xs`}
                                      value={payMethod}
                                      onChange={(e) => setPayMethod(e.target.value)}
                                    >
                                      {PAYOUT_METHODS.map((m) => (
                                        <option key={m.value} value={m.value}>
                                          {m.label}
                                        </option>
                                      ))}
                                    </select>
                                    <input
                                      className={`${inputClass} py-2 text-xs`}
                                      placeholder="Note (optional)"
                                      value={payNotes}
                                      onChange={(e) => setPayNotes(e.target.value)}
                                    />
                                    <button
                                      type="button"
                                      className={`${btnPrimary} w-full justify-center py-2 text-xs`}
                                      disabled={paySaving || !userId}
                                      onClick={() => void handleAddPayment(p.id)}
                                    >
                                      {paySaving ? "Saving…" : "Add payment"}
                                    </button>
                                  </div>
                                </div>
                              </div>
                              {!isEd && p.notes ? (
                                <p className="mt-3 text-xs text-slate-600 dark:text-slate-400">
                                  <span className="font-semibold">Notes:</span> {p.notes}
                                </p>
                              ) : null}
                            </td>
                          </tr>
                        ) : null}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className={buyCard}>
          <h2 className="mb-2 text-base font-bold text-slate-900 dark:text-white">New record</h2>
          <form className="flex flex-col gap-2" onSubmit={handleCreate}>
            <div>
              <label className={labelClass}>Seller name</label>
              <input
                className={`${inputClass} py-2 text-xs sm:text-sm`}
                value={sellerName}
                onChange={(e) => setSellerName(e.target.value)}
                required
              />
            </div>
            <div>
              <label className={labelClass}>Seller phone</label>
              <input
                className={`${inputClass} py-2 text-xs sm:text-sm`}
                value={sellerPhone}
                onChange={(e) => setSellerPhone(e.target.value)}
                required
              />
            </div>
            <div>
              <span className={labelClass}>What you bought</span>
              <div className="mt-0.5 flex flex-wrap gap-2 text-xs">
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="radio"
                    name="buyKind"
                    checked={itemKind === "laptop"}
                    onChange={() => setItemKind("laptop")}
                  />
                  Laptop
                </label>
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="radio"
                    name="buyKind"
                    checked={itemKind === "accessory"}
                    onChange={() => setItemKind("accessory")}
                  />
                  Accessory
                </label>
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="radio"
                    name="buyKind"
                    checked={itemKind === "other"}
                    onChange={() => setItemKind("other")}
                  />
                  Other
                </label>
              </div>
            </div>
            {itemKind === "laptop" ? (
              <div>
                <label className={labelClass}>Laptop (description / model)</label>
                <input
                  className={`${inputClass} py-2 text-xs sm:text-sm`}
                  value={laptopName}
                  onChange={(e) => setLaptopName(e.target.value)}
                  required
                />
              </div>
            ) : null}
            {itemKind === "accessory" ? (
              <div>
                <label className={labelClass}>Accessory name</label>
                <input
                  className={`${inputClass} py-2 text-xs sm:text-sm`}
                  value={accessoryName}
                  onChange={(e) => setAccessoryName(e.target.value)}
                  required
                />
              </div>
            ) : null}
            {itemKind === "other" ? (
              <div>
                <label className={labelClass}>Description</label>
                <input
                  className={`${inputClass} py-2 text-xs sm:text-sm`}
                  value={itemDescription}
                  onChange={(e) => setItemDescription(e.target.value)}
                  required
                />
              </div>
            ) : null}
            <div>
              <label className={labelClass}>Total agreed to pay seller</label>
              <input
                className={`${inputClass} py-2 text-xs sm:text-sm`}
                value={agreedPrice}
                onChange={(e) => setAgreedPrice(e.target.value)}
                required
              />
            </div>
            <div>
              <label className={labelClass}>Notes (optional)</label>
              <textarea
                className={`${inputClass} min-h-[56px] py-2 text-xs sm:text-sm`}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
            <button
              type="submit"
              className={`${btnPrimary} mt-0.5 w-full justify-center py-2 text-xs sm:text-sm`}
              disabled={saving || !userId}
            >
              {saving ? "Saving…" : "Add record"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
