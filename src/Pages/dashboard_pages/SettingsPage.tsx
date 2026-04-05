import { useCallback, useEffect, useState } from "react";
import { getApiBaseUrl } from "../../services/apiClient";
import { useAppSelector } from "../../Redux/hooks";
import * as api from "../../services/salaanApi";
import type { ShopUser } from "../../types/domain";
import PageHeader from "./PageHeader";
import { cardClass, tableWrap, tdClass, thClass } from "./dashboardUi";

export default function SettingsPage() {
  const user = useAppSelector((s) => s.auth.user);

  const [users, setUsers] = useState<ShopUser[]>([]);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [loadingUsers, setLoadingUsers] = useState(false);

  const loadUsers = useCallback(async () => {
    if (user?.role !== "ADMIN") return;
    setUsersError(null);
    setLoadingUsers(true);
    try {
      setUsers(await api.listUsers());
    } catch (e) {
      setUsersError(e instanceof Error ? e.message : "Could not load users");
    } finally {
      setLoadingUsers(false);
    }
  }, [user?.role]);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  return (
    <div>
      <PageHeader title="Settings" subtitle="Session profile and API connection. Team list uses GET /users (admin only)." />

      <div className="grid gap-8 lg:grid-cols-2">
        <div className={cardClass}>
          <h2 className="mb-4 text-lg font-bold text-slate-900 dark:text-white">Your session</h2>
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Email</dt>
              <dd className="mt-1 font-medium text-slate-900 dark:text-white">{user?.email ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Name</dt>
              <dd className="mt-1 font-medium text-slate-900 dark:text-white">{user?.fullName ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Role</dt>
              <dd className="mt-1 font-medium text-slate-900 dark:text-white">{user?.role ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-[11px] font-bold uppercase tracking-wider text-slate-500">API base</dt>
              <dd className="mt-1 break-all font-mono text-xs text-blue-600 dark:text-blue-400">{getApiBaseUrl()}</dd>
            </div>
          </dl>
        </div>

        <div className={cardClass}>
          <h2 className="mb-2 text-lg font-bold text-slate-900 dark:text-white">Theme</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Dark/light is controlled from the sidebar toggle and stored as <code className="rounded bg-slate-100 px-1 dark:bg-slate-800">salaan_theme</code> in localStorage.
          </p>
        </div>
      </div>

      {user?.role === "ADMIN" ? (
        <div className={`${cardClass} mt-8`}>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Team (users)</h2>
            <button
              type="button"
              onClick={() => void loadUsers()}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
            >
              Refresh
            </button>
          </div>
          {usersError ? (
            <p className="text-sm text-red-600 dark:text-red-400">{usersError}</p>
          ) : loadingUsers ? (
            <p className="text-sm text-slate-500">Loading…</p>
          ) : users.length === 0 ? (
            <p className="text-sm text-slate-500">No users returned.</p>
          ) : (
            <div className={tableWrap}>
              <table className="w-full min-w-[400px] border-collapse">
                <thead>
                  <tr>
                    <th className={thClass}>Email</th>
                    <th className={thClass}>Name</th>
                    <th className={thClass}>Role</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td className={tdClass}>{u.email}</td>
                      <td className={tdClass}>{u.fullName ?? "—"}</td>
                      <td className={tdClass}>{u.role}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <p className="mt-8 text-sm text-slate-500 dark:text-slate-400">
          Ask an admin to manage users. Your role is <strong>{user?.role}</strong>.
        </p>
      )}
    </div>
  );
}
