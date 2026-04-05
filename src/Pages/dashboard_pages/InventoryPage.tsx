import { useCallback, useEffect, useState } from "react";
import { FaCheck, FaPenToSquare, FaTrash, FaXmark } from "react-icons/fa6";
import { useAppSelector } from "../../Redux/hooks";
import * as api from "../../services/salaanApi";
import type { Accessory, Laptop } from "../../types/domain";
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

type Tab = "laptops" | "accessories";

type LaptopDraft = Pick<Laptop, "name" | "price" | "discount" | "ram" | "storage" | "processor"> & {
  is_available: boolean;
};

type AccDraft = Pick<Accessory, "name" | "price" | "discount" | "category"> & { quantity: number };

export default function InventoryPage() {
  const userId = useAppSelector((s) => s.auth.user?.id);

  const [tab, setTab] = useState<Tab>("laptops");
  const [laptops, setLaptops] = useState<Laptop[]>([]);
  const [accessories, setAccessories] = useState<Accessory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [lapForm, setLapForm] = useState({
    name: "",
    price: "",
    discount: "0",
    ram: "",
    storage: "",
    processor: "",
    is_available: true,
  });
  const [accForm, setAccForm] = useState({ name: "", price: "", discount: "0", category: "", quantity: "1" });
  const [saving, setSaving] = useState(false);

  const [editingLaptopId, setEditingLaptopId] = useState<string | null>(null);
  const [laptopDraft, setLaptopDraft] = useState<LaptopDraft | null>(null);
  const [editingAccId, setEditingAccId] = useState<string | null>(null);
  const [accDraft, setAccDraft] = useState<AccDraft | null>(null);
  const [editSaving, setEditSaving] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const [l, a] = await Promise.all([api.listLaptops(), api.listAccessories()]);
      setLaptops(l);
      setAccessories(a);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load inventory");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function addLaptop(e: React.FormEvent) {
    e.preventDefault();
    if (!userId) return;
    setSaving(true);
    setError(null);
    try {
      await api.createLaptop({ ...lapForm, user_id: userId });
      setLapForm({ name: "", price: "", discount: "0", ram: "", storage: "", processor: "", is_available: true });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add laptop");
    } finally {
      setSaving(false);
    }
  }

  async function removeLaptop(id: string) {
    if (!window.confirm("Remove this laptop from inventory?")) return;
    setError(null);
    try {
      await api.deleteLaptop(id);
      if (editingLaptopId === id) {
        setEditingLaptopId(null);
        setLaptopDraft(null);
      }
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  }

  function startLaptopEdit(x: Laptop) {
    setEditingLaptopId(x.id);
    setLaptopDraft({
      name: x.name,
      price: x.price,
      discount: x.discount,
      ram: x.ram,
      storage: x.storage,
      processor: x.processor,
      is_available: x.is_available !== false,
    });
  }

  async function saveLaptopEdit(ownerUserId: string) {
    if (!editingLaptopId || !laptopDraft) return;
    setEditSaving(true);
    setError(null);
    try {
      await api.updateLaptop(editingLaptopId, {
        name: laptopDraft.name,
        price: laptopDraft.price,
        discount: laptopDraft.discount,
        ram: laptopDraft.ram,
        storage: laptopDraft.storage,
        processor: laptopDraft.processor,
        is_available: laptopDraft.is_available,
        user_id: ownerUserId,
      });
      setEditingLaptopId(null);
      setLaptopDraft(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setEditSaving(false);
    }
  }

  async function removeAccessory(id: string) {
    if (!window.confirm("Remove this accessory?")) return;
    setError(null);
    try {
      await api.deleteAccessory(id);
      if (editingAccId === id) {
        setEditingAccId(null);
        setAccDraft(null);
      }
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  }

  function startAccEdit(x: Accessory) {
    setEditingAccId(x.id);
    setAccDraft({
      name: x.name,
      price: x.price,
      discount: x.discount,
      category: x.category ?? "",
      quantity: x.quantity ?? 1,
    });
  }

  async function saveAccEdit(ownerUserId: string) {
    if (!editingAccId || !accDraft) return;
    setEditSaving(true);
    setError(null);
    try {
      await api.updateAccessory(editingAccId, {
        name: accDraft.name,
        price: accDraft.price,
        discount: accDraft.discount,
        category: accDraft.category || undefined,
        quantity: accDraft.quantity,
        user_id: ownerUserId,
      });
      setEditingAccId(null);
      setAccDraft(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setEditSaving(false);
    }
  }

  async function addAccessory(e: React.FormEvent) {
    e.preventDefault();
    if (!userId) return;
    setSaving(true);
    setError(null);
    try {
      const q = parseInt(accForm.quantity, 10);
      await api.createAccessory({
        name: accForm.name,
        price: accForm.price,
        discount: accForm.discount,
        category: accForm.category || undefined,
        quantity: Number.isFinite(q) && q >= 0 ? q : 1,
        user_id: userId,
      });
      setAccForm({ name: "", price: "", discount: "0", category: "", quantity: "1" });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add accessory");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Inventory"
        subtitle="Laptops can be marked available or not; selling a laptop sets it unavailable. Accessories use quantity; each sale reduces stock by 1."
      />

      {error ? (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
          {error}
        </div>
      ) : null}

      <div className="mb-6 flex gap-2 rounded border border-slate-200/90 bg-white/80 p-1 dark:border-slate-700 dark:bg-slate-900/40">
        {(["laptops", "accessories"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`flex-1 rounded py-2.5 text-sm font-bold capitalize transition ${
              tab === t
                ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md"
                : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "laptops" ? (
        <div className="grid gap-8 lg:grid-cols-[1fr,minmax(280px,340px)]">
          <div className={cardClass}>
            <h2 className="mb-4 text-lg font-bold text-slate-900 dark:text-white">Laptops</h2>
            {loading ? (
              <p className="text-sm text-slate-500">Loading…</p>
            ) : laptops.length === 0 ? (
              <p className="text-sm text-slate-500">No laptops in stock.</p>
            ) : (
              <div className={tableWrap}>
                <table className="w-full min-w-[640px] border-collapse">
                  <thead>
                    <tr>
                      <th className={thClass}>Name</th>
                      <th className={thClass}>Specs</th>
                      <th className={thClass}>Price</th>
                      <th className={thClass}>Disc.</th>
                      <th className={thClass}>Available</th>
                      <th className={`${thClass} w-28 text-right`}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {laptops.map((x) => {
                      const isEd = editingLaptopId === x.id && laptopDraft;
                      return (
                        <tr key={x.id}>
                          <td className={tdClass}>
                            {isEd ? (
                              <input
                                className={tableInputClass}
                                value={laptopDraft!.name}
                                onChange={(e) =>
                                  setLaptopDraft((d) => (d ? { ...d, name: e.target.value } : d))
                                }
                              />
                            ) : (
                              x.name
                            )}
                          </td>
                          <td className={`${tdClass} text-xs`}>
                            {isEd ? (
                              <div className="space-y-1">
                                <input
                                  className={tableInputClass}
                                  value={laptopDraft!.ram}
                                  onChange={(e) =>
                                    setLaptopDraft((d) => (d ? { ...d, ram: e.target.value } : d))
                                  }
                                />
                                <input
                                  className={tableInputClass}
                                  value={laptopDraft!.storage}
                                  onChange={(e) =>
                                    setLaptopDraft((d) => (d ? { ...d, storage: e.target.value } : d))
                                  }
                                />
                                <input
                                  className={tableInputClass}
                                  value={laptopDraft!.processor}
                                  onChange={(e) =>
                                    setLaptopDraft((d) => (d ? { ...d, processor: e.target.value } : d))
                                  }
                                />
                              </div>
                            ) : (
                              <span className="text-slate-500">
                                {x.ram} / {x.storage} · {x.processor}
                              </span>
                            )}
                          </td>
                          <td className={tdClass}>
                            {isEd ? (
                              <input
                                className={tableInputClass}
                                value={laptopDraft!.price}
                                onChange={(e) =>
                                  setLaptopDraft((d) => (d ? { ...d, price: e.target.value } : d))
                                }
                              />
                            ) : (
                              x.price
                            )}
                          </td>
                          <td className={tdClass}>
                            {isEd ? (
                              <input
                                className={tableInputClass}
                                value={laptopDraft!.discount}
                                onChange={(e) =>
                                  setLaptopDraft((d) => (d ? { ...d, discount: e.target.value } : d))
                                }
                              />
                            ) : (
                              x.discount
                            )}
                          </td>
                          <td className={tdClass}>
                            {isEd ? (
                              <label className="flex cursor-pointer items-center gap-2 text-xs">
                                <input
                                  type="checkbox"
                                  checked={laptopDraft!.is_available}
                                  onChange={(e) =>
                                    setLaptopDraft((d) => (d ? { ...d, is_available: e.target.checked } : d))
                                  }
                                  className="rounded border-slate-300 text-blue-600"
                                />
                                For sale
                              </label>
                            ) : x.is_available === false ? (
                              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-900 dark:bg-amber-950/50 dark:text-amber-200">
                                No
                              </span>
                            ) : (
                              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200">
                                Yes
                              </span>
                            )}
                          </td>
                          <td className={`${tdClass} text-right`}>
                            <div className="flex flex-wrap justify-end gap-1">
                              {isEd ? (
                                <>
                                  <button
                                    type="button"
                                    className={btnEdit}
                                    disabled={editSaving}
                                    title="Save"
                                    onClick={() => void saveLaptopEdit(x.user_id)}
                                  >
                                    <FaCheck className="h-4 w-4 text-emerald-600" />
                                  </button>
                                  <button
                                    type="button"
                                    className={btnDanger}
                                    title="Cancel"
                                    onClick={() => {
                                      setEditingLaptopId(null);
                                      setLaptopDraft(null);
                                    }}
                                  >
                                    <FaXmark className="h-4 w-4" />
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button type="button" className={btnEdit} title="Edit" onClick={() => startLaptopEdit(x)}>
                                    <FaPenToSquare className="h-4 w-4" />
                                  </button>
                                  <button
                                    type="button"
                                    className={btnDanger}
                                    onClick={() => void removeLaptop(x.id)}
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
          <form onSubmit={(e) => void addLaptop(e)} className={`${cardClass} h-fit space-y-3`}>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Add laptop</h2>
            <div>
              <label className={labelClass}>Name</label>
              <input
                className={inputClass}
                value={lapForm.name}
                onChange={(e) => setLapForm((f) => ({ ...f, name: e.target.value }))}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={labelClass}>Price</label>
                <input
                  className={inputClass}
                  value={lapForm.price}
                  onChange={(e) => setLapForm((f) => ({ ...f, price: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className={labelClass}>Discount</label>
                <input
                  className={inputClass}
                  value={lapForm.discount}
                  onChange={(e) => setLapForm((f) => ({ ...f, discount: e.target.value }))}
                  required
                />
              </div>
            </div>
            <div>
              <label className={labelClass}>RAM</label>
              <input
                className={inputClass}
                value={lapForm.ram}
                onChange={(e) => setLapForm((f) => ({ ...f, ram: e.target.value }))}
                required
                placeholder="16GB"
              />
            </div>
            <div>
              <label className={labelClass}>Storage</label>
              <input
                className={inputClass}
                value={lapForm.storage}
                onChange={(e) => setLapForm((f) => ({ ...f, storage: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className={labelClass}>Processor</label>
              <input
                className={inputClass}
                value={lapForm.processor}
                onChange={(e) => setLapForm((f) => ({ ...f, processor: e.target.value }))}
                required
              />
            </div>
            <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={lapForm.is_available}
                onChange={(e) => setLapForm((f) => ({ ...f, is_available: e.target.checked }))}
                className="rounded border-slate-300 text-blue-600"
              />
              Available for sale
            </label>
            <button type="submit" className={`${btnPrimary} w-full`} disabled={saving || !userId}>
              {saving ? "Saving…" : "Add laptop"}
            </button>
          </form>
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-[1fr,minmax(280px,340px)]">
          <div className={cardClass}>
            <h2 className="mb-4 text-lg font-bold text-slate-900 dark:text-white">Accessories</h2>
            {loading ? (
              <p className="text-sm text-slate-500">Loading…</p>
            ) : accessories.length === 0 ? (
              <p className="text-sm text-slate-500">No accessories.</p>
            ) : (
              <div className={tableWrap}>
                <table className="w-full min-w-[480px] border-collapse">
                  <thead>
                    <tr>
                      <th className={thClass}>Name</th>
                      <th className={thClass}>Category</th>
                      <th className={thClass}>Qty</th>
                      <th className={thClass}>Price</th>
                      <th className={thClass}>Disc.</th>
                      <th className={`${thClass} w-28 text-right`}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {accessories.map((x) => {
                      const isEd = editingAccId === x.id && accDraft;
                      return (
                        <tr key={x.id}>
                          <td className={tdClass}>
                            {isEd ? (
                              <input
                                className={tableInputClass}
                                value={accDraft!.name}
                                onChange={(e) => setAccDraft((d) => (d ? { ...d, name: e.target.value } : d))}
                              />
                            ) : (
                              x.name
                            )}
                          </td>
                          <td className={tdClass}>
                            {isEd ? (
                              <input
                                className={tableInputClass}
                                value={accDraft!.category ?? ""}
                                onChange={(e) => setAccDraft((d) => (d ? { ...d, category: e.target.value } : d))}
                              />
                            ) : (
                              x.category ?? "—"
                            )}
                          </td>
                          <td className={tdClass}>
                            {isEd ? (
                              <input
                                type="number"
                                min={0}
                                className={tableInputClass}
                                value={accDraft!.quantity}
                                onChange={(e) =>
                                  setAccDraft((d) =>
                                    d ? { ...d, quantity: Math.max(0, parseInt(e.target.value, 10) || 0) } : d,
                                  )
                                }
                              />
                            ) : (
                              <span className="font-mono font-semibold">{x.quantity ?? 0}</span>
                            )}
                          </td>
                          <td className={tdClass}>
                            {isEd ? (
                              <input
                                className={tableInputClass}
                                value={accDraft!.price}
                                onChange={(e) => setAccDraft((d) => (d ? { ...d, price: e.target.value } : d))}
                              />
                            ) : (
                              x.price
                            )}
                          </td>
                          <td className={tdClass}>
                            {isEd ? (
                              <input
                                className={tableInputClass}
                                value={accDraft!.discount}
                                onChange={(e) => setAccDraft((d) => (d ? { ...d, discount: e.target.value } : d))}
                              />
                            ) : (
                              x.discount
                            )}
                          </td>
                          <td className={`${tdClass} text-right`}>
                            <div className="flex flex-wrap justify-end gap-1">
                              {isEd ? (
                                <>
                                  <button
                                    type="button"
                                    className={btnEdit}
                                    disabled={editSaving}
                                    title="Save"
                                    onClick={() => void saveAccEdit(x.user_id)}
                                  >
                                    <FaCheck className="h-4 w-4 text-emerald-600" />
                                  </button>
                                  <button
                                    type="button"
                                    className={btnDanger}
                                    title="Cancel"
                                    onClick={() => {
                                      setEditingAccId(null);
                                      setAccDraft(null);
                                    }}
                                  >
                                    <FaXmark className="h-4 w-4" />
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button type="button" className={btnEdit} title="Edit" onClick={() => startAccEdit(x)}>
                                    <FaPenToSquare className="h-4 w-4" />
                                  </button>
                                  <button
                                    type="button"
                                    className={btnDanger}
                                    onClick={() => void removeAccessory(x.id)}
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
          <form onSubmit={(e) => void addAccessory(e)} className={`${cardClass} h-fit space-y-3`}>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Add accessory</h2>
            <div>
              <label className={labelClass}>Name</label>
              <input
                className={inputClass}
                value={accForm.name}
                onChange={(e) => setAccForm((f) => ({ ...f, name: e.target.value }))}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={labelClass}>Price</label>
                <input
                  className={inputClass}
                  value={accForm.price}
                  onChange={(e) => setAccForm((f) => ({ ...f, price: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className={labelClass}>Discount</label>
                <input
                  className={inputClass}
                  value={accForm.discount}
                  onChange={(e) => setAccForm((f) => ({ ...f, discount: e.target.value }))}
                  required
                />
              </div>
            </div>
            <div>
              <label className={labelClass}>Category</label>
              <input
                className={inputClass}
                value={accForm.category}
                onChange={(e) => setAccForm((f) => ({ ...f, category: e.target.value }))}
                placeholder="mouse, cable…"
              />
            </div>
            <div>
              <label className={labelClass}>Quantity in stock</label>
              <input
                className={inputClass}
                type="number"
                min={0}
                value={accForm.quantity}
                onChange={(e) => setAccForm((f) => ({ ...f, quantity: e.target.value }))}
                required
              />
            </div>
            <button type="submit" className={`${btnPrimary} w-full`} disabled={saving || !userId}>
              {saving ? "Saving…" : "Add accessory"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
