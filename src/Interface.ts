export type UserRole = "ADMIN" | "STAFF";

export type LoginRequest = {
  email: string;
  password: string;
};

export type AuthUser = {
  id: string;
  email: string;
  fullName: string | null;
  role: UserRole;
};

/** Login sets HttpOnly cookies; body only returns the signed-in user. */
export type LoginResponse = {
  user: AuthUser;
};

export type AuthState = {
  loading: boolean;
  /** True until the first GET /auth/me (session restore) finishes. */
  restorePending: boolean;
  error: string | null;
  user: AuthUser | null;
};
