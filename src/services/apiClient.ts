/** Set `VITE_API_URL` at build time if the API is on another origin (e.g. https://api.example.com). */
const envUrl = import.meta.env.VITE_API_URL as string | undefined;
const API_BASE_URL = (envUrl && envUrl.replace(/\/$/, "")) || "/api";

type AuthFailureHandler = () => void;
let authFailureHandler: AuthFailureHandler | null = null;

/** Call from `main.tsx` so 401-after-failed-refresh clears Redux without a circular import. */
export function registerAuthFailureHandler(handler: AuthFailureHandler) {
  authFailureHandler = handler;
}

export function getApiBaseUrl(): string {
  return API_BASE_URL;
}

export async function readErrorMessage(res: Response): Promise<string> {
  const text = await res.text();
  if (!text) return res.statusText || "Request failed";
  try {
    const j = JSON.parse(text) as { message?: unknown };
    if (typeof j.message === "string") return j.message;
  } catch {
    /* ignore */
  }
  return text.slice(0, 200);
}

let refreshLock: Promise<boolean> | null = null;

async function tryRefreshOnce(): Promise<boolean> {
  if (refreshLock) return refreshLock;
  refreshLock = (async () => {
    try {
      const res = await fetch(`${getApiBaseUrl()}/auth/refresh`, {
        method: "POST",
        credentials: "include",
      });
      return res.ok;
    } finally {
      refreshLock = null;
    }
  })();
  return refreshLock;
}

function skipRefreshRetry(path: string): boolean {
  return (
    path.startsWith("/auth/login") ||
    path.startsWith("/auth/refresh") ||
    path.startsWith("/auth/logout")
  );
}

export async function apiFetch(
  path: string,
  init: RequestInit = {},
  allowRefreshRetry = true,
): Promise<Response> {
  const url = `${getApiBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`;
  const headers = new Headers(init.headers);
  if (init.body !== undefined && !(init.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const res = await fetch(url, { ...init, headers, credentials: "include" });

  if (res.status === 401 && allowRefreshRetry && !skipRefreshRetry(path)) {
    const refreshed = await tryRefreshOnce();
    if (refreshed) {
      return apiFetch(path, init, false);
    }
    authFailureHandler?.();
  }

  return res;
}

export async function apiJson<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await apiFetch(path, init);
  if (!res.ok) throw new Error(await readErrorMessage(res));
  if (res.status === 204) return undefined as T;
  const text = await res.text();
  if (!text) return undefined as T;
  return JSON.parse(text) as T;
}

export async function apiVoid(path: string, init: RequestInit): Promise<void> {
  const res = await apiFetch(path, init);
  if (!res.ok) throw new Error(await readErrorMessage(res));
}
