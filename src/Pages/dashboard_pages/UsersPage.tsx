import { useCallback, useEffect, useState } from "react";
import { FaCheck, FaPenToSquare, FaTrash, FaXmark } from "react-icons/fa6";
import { useAppSelector } from "../../Redux/hooks";
import * as api from "../../services/salaanApi";
import type { ShopUser } from "../../types/domain";
import PageHeader from "./PageHeader";
import {
  btnDanger,
  btnEdit,
  btnGhost,
  btnPrimary,
  cardClass,
  inputClass,
  labelClass,
  tableInputClass,
  tableWrap,
  tdClass,
  thClass,
} from "./dashboardUi";

type RoleOpt = "STAFF" | "ADMIN";

type UserDraft = {
  email: string;
  fullName: string;
  role: RoleOpt;
  password: string;
};

const emptyNew = {
  email: "",
  password: "",
  fullName: "",
  role: "STAFF" as RoleOpt,
};

function userToDraft(u: ShopUser): UserDraft {
  return {
    email: u.email,
    fullName: u.fullName ?? "",
    role: u.role === "ADMIN" ? "ADMIN" : "STAFF",
    password: "",
  };
}

export default function UsersPage() {
  const user = useAppSelector((s) => s.auth.user);
  const myId = user?.id;

  const [users, setUsers] = useState<ShopUser[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [newUser, setNewUser] = useState(emptyNew);
  const [creating, setCreating] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<UserDraft | null>(null);
  const [editSaving, setEditSaving] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      setUsers(await api.listUsers());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load users");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.role !== "ADMIN") return;
    void load();
  }, [load, user?.role]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setError(null);
    try {
      await api.createUser({
        email: newUser.email.trim(),
        password: newUser.password,
        fullName: newUser.fullName.trim() || null,
        role: newUser.role,
      });
      setNewUser(emptyNew);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create user");
    } finally {
      setCreating(false);
    }
  }

  function startEdit(u: ShopUser) {
    setEditingId(u.id);
    setEditDraft(userToDraft(u));
  }

  async function saveEdit(id: string) {
    if (!editDraft) return;
    setEditSaving(true);
    setError(null);
    try {
      const body: { email?: string; fullName?: string | null; role?: string; password?: string } = {
        email: editDraft.email.trim(),
        fullName: editDraft.fullName.trim() || null,
        role: editDraft.role,
      };
      if (editDraft.password.trim()) body.password = editDraft.password;
      await api.updateUser(id, body);
      setEditingId(null);
      setEditDraft(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setEditSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (id === myId) return;
    if (!window.confirm("Remove this user? They will no longer be able to sign in.")) return;
    setError(null);
    try {
      await api.deleteUser(id);
      if (editingId === id) {
        setEditingId(null);
        setEditDraft(null);
      }
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  }

  return (
    <div>
      <PageHeader
        title="Users"
        subtitle="Create, edit, and remove shop accounts (admin only). Password is required for new users; leave blank when editing to keep the current password."
      />

      {error ? (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr),minmax(280px,340px)]">
        <div className={cardClass}>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Team directory</h2>
            <button type="button" onClick={() => void load()} className={btnGhost}>
              Refresh
            </button>
          </div>
          {loading ? (
            <p className="text-sm text-slate-500">Loading…</p>
          ) : users.length === 0 ? (
            <p className="text-sm text-slate-500">No users yet. Add one with the form.</p>
          ) : (
            <div className={tableWrap}>
              <table className="w-full min-w-[640px] border-collapse">
                <thead>
                  <tr>
                    <th className={thClass}>Email</th>
                    <th className={thClass}>Name</th>
                    <th className={thClass}>Role</th>
                    <th className={thClass}>Joined</th>
                    <th className={`${thClass} w-32 text-right`}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => {
                    const isEd = editingId === u.id && editDraft;
                    return (
                      <tr key={u.id}>
                        <td className={tdClass}>
                          {isEd ? (
                            <input
                              className={tableInputClass}
                              value={editDraft!.email}
                              onChange={(e) => setEditDraft((d) => (d ? { ...d, email: e.target.value } : d))}
                            />
                          ) : (
                            u.email
                          )}
                        </td>
                        <td className={tdClass}>
                          {isEd ? (
                            <input
                              className={tableInputClass}
                              value={editDraft!.fullName}
                              onChange={(e) => setEditDraft((d) => (d ? { ...d, fullName: e.target.value } : d))}
                              placeholder="Name"
                            />
                          ) : (
                            u.fullName ?? "—"
                          )}
                        </td>
                        <td className={tdClass}>
                          {isEd ? (
                            <select
                              className={tableInputClass}
                              value={editDraft!.role}
                              onChange={(e) =>
                                setEditDraft((d) =>
                                  d ? { ...d, role: e.target.value as RoleOpt } : d,
                                )
                              }
                            >
                              <option value="STAFF">STAFF</option>
                              <option value="ADMIN">ADMIN</option>
                            </select>
                          ) : (
                            <span
                              className={
                                u.role === "ADMIN"
                                  ? "rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-bold text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-200"
                                  : "rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                              }
                            >
                              {u.role}
                            </span>
                          )}
                        </td>
                        <td className={`${tdClass} text-xs text-slate-500`}>
                          {new Date(u.createdAt).toLocaleDateString()}
                        </td>
                        <td className={`${tdClass} text-right`}>
                          <div className="flex flex-col items-end gap-2">
                            {isEd ? (
                              <>
                                <input
                                  className={tableInputClass}
                                  type="password"
                                  value={editDraft!.password}
                                  onChange={(e) => setEditDraft((d) => (d ? { ...d, password: e.target.value } : d))}
                                  placeholder="New password (optional)"
                                  autoComplete="new-password"
                                />
                                <div className="flex flex-wrap justify-end gap-1">
                                  <button
                                    type="button"
                                    className={btnEdit}
                                    title="Save"
                                    disabled={editSaving}
                                    onClick={() => void saveEdit(u.id)}
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
                                </div>
                              </>
                            ) : (
                              <div className="flex flex-wrap justify-end gap-1">
                                <button type="button" className={btnEdit} title="Edit" onClick={() => startEdit(u)}>
                                  <FaPenToSquare className="h-4 w-4" />
                                </button>
                                <button
                                  type="button"
                                  className={btnDanger}
                                  disabled={u.id === myId}
                                  title={u.id === myId ? "Cannot delete yourself" : "Remove"}
                                  onClick={() => void handleDelete(u.id)}
                                >
                                  <FaTrash className="h-4 w-4" />
                                </button>
                              </div>
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
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Add user</h2>
          <div>
            <label className={labelClass} htmlFor="nu-email">
              Email
            </label>
            <input
              id="nu-email"
              className={inputClass}
              type="email"
              value={newUser.email}
              onChange={(e) => setNewUser((n) => ({ ...n, email: e.target.value }))}
              required
              autoComplete="off"
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="nu-pass">
              Password
            </label>
            <input
              id="nu-pass"
              className={inputClass}
              type="password"
              value={newUser.password}
              onChange={(e) => setNewUser((n) => ({ ...n, password: e.target.value }))}
              required
              minLength={6}
              autoComplete="new-password"
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="nu-name">
              Full name
            </label>
            <input
              id="nu-name"
              className={inputClass}
              value={newUser.fullName}
              onChange={(e) => setNewUser((n) => ({ ...n, fullName: e.target.value }))}
              placeholder="Optional"
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="nu-role">
              Role
            </label>
            <select
              id="nu-role"
              className={inputClass}
              value={newUser.role}
              onChange={(e) => setNewUser((n) => ({ ...n, role: e.target.value as RoleOpt }))}
            >
              <option value="STAFF">Staff</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>
          <button type="submit" className={`${btnPrimary} w-full`} disabled={creating}>
            {creating ? "Creating…" : "Create user"}
          </button>
        </form>
      </div>
    </div>
  );
}
