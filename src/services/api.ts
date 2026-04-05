import type { LoginRequest, LoginResponse } from "../Interface";
import { getApiBaseUrl } from "./apiClient";

export async function loginRequest(payload: LoginRequest): Promise<LoginResponse> {
  const res = await fetch(`${getApiBaseUrl()}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  const data = (await res.json().catch(() => null)) as { message?: string } & Partial<LoginResponse> | null;
  if (!res.ok) {
    const message = data?.message ?? "Login failed";
    throw new Error(message);
  }

  return data as LoginResponse;
}

