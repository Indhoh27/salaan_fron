import { useCallback, useEffect, useState } from "react";
import { FaCheck, FaPenToSquare, FaTrash, FaXmark } from "react-icons/fa6";
import { useAppSelector } from "../../Redux/hooks";
import * as api from "../../services/salaanApi";
import type { Expense } from "../../types/domain";
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

export default function ExpensesPage() {
  const userId = useAppSelector((s) => s.auth.user?.id);

  const [rows, setRows] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [saving, setSaving] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDescription, setEditDescription] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [editSaving, setEditSaving] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      setRows(await api.listExpenses());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load expenses");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!userId) return;
    setSaving(true);
    setError(null);
    try {
      await api.createExpense({ description, amount, user_id: userId });
      setDescription("");
      setAmount("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add expense");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Remove this expense?")) return;
    setError(null);
    try {
      await api.deleteExpense(id);
      if (editingId === id) {
        setEditingId(null);
        setEditDescription("");
        setEditAmount("");
      }
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  }

  function startEdit(x: Expense) {
    setEditingId(x.id);
    setEditDescription(x.description);
    setEditAmount(x.amount);
  }

  async function saveEdit(ownerUserId: string) {
    if (!editingId) return;
    setEditSaving(true);
    setError(null);
    try {
      await api.updateExpense(editingId, {
        description: editDescription,
        amount: editAmount,
        user_id: ownerUserId,
      });
      setEditingId(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setEditSaving(false);
    }
  }

  return (
    <div>
      <PageHeader title="Expenses" subtitle="Edit with PUT /expenses/:id, add with POST, remove with DELETE." />

      {error ? (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
          {error}
        </div>
      ) : null}

      <div className="grid gap-8 lg:grid-cols-[1fr,minmax(280px,320px)]">
        <div className={cardClass}>
          <h2 className="mb-4 text-lg font-bold text-slate-900 dark:text-white">Ledger</h2>
          {loading ? (
            <p className="text-sm text-slate-500">Loading…</p>
          ) : rows.length === 0 ? (
            <p className="text-sm text-slate-500">No expenses logged.</p>
          ) : (
            <div className={tableWrap}>
              <table className="w-full min-w-[440px] border-collapse">
                <thead>
                  <tr>
                    <th className={thClass}>Description</th>
                    <th className={thClass}>Amount</th>
                    <th className={thClass}>Date</th>
                    <th className={`${thClass} w-28 text-right`}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((x) => {
                    const isEd = editingId === x.id;
                    return (
                      <tr key={x.id}>
                        <td className={tdClass}>
                          {isEd ? (
                            <input
                              className={tableInputClass}
                              value={editDescription}
                              onChange={(e) => setEditDescription(e.target.value)}
                            />
                          ) : (
                            x.description
                          )}
                        </td>
                        <td className={tdClass}>
                          {isEd ? (
                            <input
                              className={tableInputClass}
                              value={editAmount}
                              onChange={(e) => setEditAmount(e.target.value)}
                            />
                          ) : (
                            x.amount
                          )}
                        </td>
                        <td className={`${tdClass} text-xs text-slate-500`}>
                          {new Date(x.createdAt).toLocaleDateString()}
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
                                  onClick={() => void saveEdit(x.user_id)}
                                >
                                  <FaCheck className="h-4 w-4 text-emerald-600" />
                                </button>
                                <button
                                  type="button"
                                  className={btnDanger}
                                  title="Cancel"
                                  onClick={() => setEditingId(null)}
                                >
                                  <FaXmark className="h-4 w-4" />
                                </button>
                              </>
                            ) : (
                              <>
                                <button type="button" className={btnEdit} title="Edit" onClick={() => startEdit(x)}>
                                  <FaPenToSquare className="h-4 w-4" />
                                </button>
                                <button
                                  type="button"
                                  className={btnDanger}
                                  onClick={() => void handleDelete(x.id)}
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
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Add expense</h2>
          <div>
            <label className={labelClass}>Description</label>
            <input
              className={inputClass}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              placeholder="Rent, parts, utilities…"
            />
          </div>
          <div>
            <label className={labelClass}>Amount</label>
            <input className={inputClass} value={amount} onChange={(e) => setAmount(e.target.value)} required />
          </div>
          <button type="submit" className={`${btnPrimary} w-full`} disabled={saving || !userId}>
            {saving ? "Saving…" : "Save expense"}
          </button>
        </form>
      </div>
    </div>
  );
}
