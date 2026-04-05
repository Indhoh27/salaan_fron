import { useCallback, useEffect, useState } from "react";
import { FaCheck, FaPenToSquare, FaTrash, FaXmark } from "react-icons/fa6";
import { useAppSelector } from "../../Redux/hooks";
import * as api from "../../services/salaanApi";
import type { Job } from "../../types/domain";
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

const PAYMENT_METHODS: { value: string; label: string }[] = [
  { value: "cash", label: "Cash" },
  { value: "zaad", label: "Zaad" },
  { value: "e dahab", label: "e-Dahab" },
];

const PAYMENT_METHOD_SET = new Set(PAYMENT_METHODS.map((m) => m.value));

function paymentMethodLabel(value: string): string {
  return PAYMENT_METHODS.find((m) => m.value === value)?.label ?? value;
}

function PaymentMethodSelect({
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
  const legacy = Boolean(value && !PAYMENT_METHOD_SET.has(value));
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
      {PAYMENT_METHODS.map((m) => (
        <option key={m.value} value={m.value}>
          {m.label}
        </option>
      ))}
    </select>
  );
}

const emptyForm = {
  service: "",
  work_details: "",
  price: "",
  customer_name: "",
  customer_phone: "",
  payment_status: "pending",
  payment_method: "cash",
};

type JobDraft = {
  service: string;
  work_details: string;
  price: string;
  customer_name: string;
  customer_phone: string;
  payment_status: string;
  payment_method: string;
  is_completed: boolean;
};

function jobToDraft(j: Job): JobDraft {
  return {
    service: j.service,
    work_details: j.work_details ?? "",
    price: j.price,
    customer_name: j.customer_name,
    customer_phone: j.customer_phone,
    payment_status: j.payment_status,
    payment_method: j.payment_method,
    is_completed: j.is_completed,
  };
}

export default function JobsPage() {
  const userId = useAppSelector((s) => s.auth.user?.id);

  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<JobDraft | null>(null);
  const [editSaving, setEditSaving] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      setJobs(await api.listJobs());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load jobs");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!userId) {
      setError("Not signed in");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await api.createJob({
        service: form.service,
        work_details: form.work_details || undefined,
        price: form.price,
        customer_name: form.customer_name,
        customer_phone: form.customer_phone,
        payment_status: form.payment_status,
        payment_method: form.payment_method,
        user_id: userId,
        device_left: false,
        has_charger: false,
        is_completed: false,
      });
      setForm(emptyForm);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create job");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Soft-delete this job?")) return;
    setError(null);
    try {
      await api.deleteJob(id);
      if (editingId === id) {
        setEditingId(null);
        setEditDraft(null);
      }
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  }

  function startEdit(j: Job) {
    setEditingId(j.id);
    setEditDraft(jobToDraft(j));
  }

  function cancelEdit() {
    setEditingId(null);
    setEditDraft(null);
  }

  async function saveEdit(job: Job) {
    if (!editingId || !editDraft) return;
    setEditSaving(true);
    setError(null);
    const wasCompleted = job.is_completed;
    const nowCompleted = editDraft.is_completed;
    const done_at = nowCompleted
      ? !wasCompleted
        ? new Date().toISOString()
        : job.done_at ?? new Date().toISOString()
      : null;
    try {
      await api.updateJob(editingId, {
        service: editDraft.service,
        work_details: editDraft.work_details || undefined,
        price: editDraft.price,
        customer_name: editDraft.customer_name,
        customer_phone: editDraft.customer_phone,
        payment_status: editDraft.payment_status,
        payment_method: editDraft.payment_method,
        is_completed: editDraft.is_completed,
        done_at,
        user_id: job.user_id,
      });
      cancelEdit();
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
        title="Jobs & repairs"
        subtitle="List, edit (PUT /jobs/:id), create, and soft-delete jobs."
      />

      {error ? (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr),minmax(280px,360px)]">
        <div className={cardClass}>
          <h2 className="mb-4 text-lg font-bold text-slate-900 dark:text-white">Open jobs</h2>
          {loading ? (
            <p className="text-sm text-slate-500">Loading…</p>
          ) : jobs.length === 0 ? (
            <p className="text-sm text-slate-500">No jobs yet. Add one with the form.</p>
          ) : (
            <div className={tableWrap}>
              <table className="w-full min-w-[720px] border-collapse">
                <thead>
                  <tr>
                    <th className={thClass}>Service</th>
                    <th className={thClass}>Customer</th>
                    <th className={thClass}>Price</th>
                    <th className={thClass}>Payment</th>
                    <th className={thClass}>Done</th>
                    <th className={`${thClass} w-28 text-right`}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.map((j) => {
                    const isEditing = editingId === j.id && editDraft;
                    return (
                      <tr key={j.id}>
                        <td className={tdClass}>
                          {isEditing ? (
                            <input
                              className={tableInputClass}
                              value={editDraft!.service}
                              onChange={(e) => setEditDraft((d) => (d ? { ...d, service: e.target.value } : d))}
                            />
                          ) : (
                            j.service
                          )}
                        </td>
                        <td className={tdClass}>
                          {isEditing ? (
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
                              <div className="font-medium">{j.customer_name}</div>
                              <div className="text-xs text-slate-500">{j.customer_phone}</div>
                            </>
                          )}
                        </td>
                        <td className={tdClass}>
                          {isEditing ? (
                            <input
                              className={tableInputClass}
                              value={editDraft!.price}
                              onChange={(e) => setEditDraft((d) => (d ? { ...d, price: e.target.value } : d))}
                            />
                          ) : (
                            j.price
                          )}
                        </td>
                        <td className={tdClass}>
                          {isEditing ? (
                            <div className="space-y-1">
                              <PaymentStatusSelect
                                className={tableInputClass}
                                value={editDraft!.payment_status}
                                onChange={(v) => setEditDraft((d) => (d ? { ...d, payment_status: v } : d))}
                              />
                              <PaymentMethodSelect
                                className={tableInputClass}
                                value={editDraft!.payment_method}
                                onChange={(v) => setEditDraft((d) => (d ? { ...d, payment_method: v } : d))}
                              />
                            </div>
                          ) : (
                            <>
                              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                                {paymentStatusLabel(j.payment_status)}
                              </span>
                              <div className="text-xs text-slate-500">{paymentMethodLabel(j.payment_method)}</div>
                            </>
                          )}
                        </td>
                        <td className={tdClass}>
                          {isEditing ? (
                            <label className="flex cursor-pointer items-center gap-2 text-xs">
                              <input
                                type="checkbox"
                                checked={editDraft!.is_completed}
                                onChange={(e) =>
                                  setEditDraft((d) => (d ? { ...d, is_completed: e.target.checked } : d))
                                }
                                className="rounded border-slate-300 text-blue-600"
                              />
                              Done
                            </label>
                          ) : j.is_completed ? (
                            "Yes"
                          ) : (
                            "No"
                          )}
                        </td>
                        <td className={`${tdClass} text-right`}>
                          <div className="flex flex-wrap items-center justify-end gap-1">
                            {isEditing ? (
                              <>
                                <button
                                  type="button"
                                  className={btnEdit}
                                  title="Save"
                                  disabled={editSaving}
                                  onClick={() => void saveEdit(j)}
                                >
                                  <FaCheck className="h-4 w-4 text-emerald-600" />
                                </button>
                                <button type="button" className={btnDanger} title="Cancel" onClick={cancelEdit}>
                                  <FaXmark className="h-4 w-4" />
                                </button>
                              </>
                            ) : (
                              <>
                                <button type="button" className={btnEdit} title="Edit" onClick={() => startEdit(j)}>
                                  <FaPenToSquare className="h-4 w-4" />
                                </button>
                                <button
                                  type="button"
                                  className={btnDanger}
                                  onClick={() => void handleDelete(j.id)}
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
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">New job</h2>
          <div>
            <label className={labelClass} htmlFor="job-service">
              Service
            </label>
            <input
              id="job-service"
              className={inputClass}
              value={form.service}
              onChange={(e) => setForm((f) => ({ ...f, service: e.target.value }))}
              required
              placeholder="Screen replacement"
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="job-details">
              Work details
            </label>
            <input
              id="job-details"
              className={inputClass}
              value={form.work_details}
              onChange={(e) => setForm((f) => ({ ...f, work_details: e.target.value }))}
              placeholder="Optional notes"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass} htmlFor="job-price">
                Price
              </label>
              <input
                id="job-price"
                className={inputClass}
                value={form.price}
                onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                required
                placeholder="99"
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="job-phone">
                Phone
              </label>
              <input
                id="job-phone"
                className={inputClass}
                value={form.customer_phone}
                onChange={(e) => setForm((f) => ({ ...f, customer_phone: e.target.value }))}
                required
              />
            </div>
          </div>
          <div>
            <label className={labelClass} htmlFor="job-customer">
              Customer name
            </label>
            <input
              id="job-customer"
              className={inputClass}
              value={form.customer_name}
              onChange={(e) => setForm((f) => ({ ...f, customer_name: e.target.value }))}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass} htmlFor="job-pay-st">
                Payment status
              </label>
              <PaymentStatusSelect
                id="job-pay-st"
                className={inputClass}
                value={form.payment_status}
                onChange={(v) => setForm((f) => ({ ...f, payment_status: v }))}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="job-pay-m">
                Payment method
              </label>
              <PaymentMethodSelect
                id="job-pay-m"
                className={inputClass}
                value={form.payment_method}
                onChange={(v) => setForm((f) => ({ ...f, payment_method: v }))}
              />
            </div>
          </div>
          <button type="submit" className={`${btnPrimary} w-full`} disabled={saving || !userId}>
            {saving ? "Saving…" : "Create job"}
          </button>
        </form>
      </div>
    </div>
  );
}
