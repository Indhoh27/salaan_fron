import { useEffect, useMemo, useState, type FormEvent } from "react";
import { FaApple, FaGoogle } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../Redux/hooks";
import { loginUser } from "../Redux/authSlice";

type Theme = "light" | "dark";

const inputClass =
  "w-full rounded border border-slate-300 bg-white/90 px-4 py-3 text-[15px] text-slate-800 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-500/15 dark:border-slate-600/80 dark:bg-slate-900/60 dark:text-slate-100 dark:placeholder:text-slate-500";

export default function LoginPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { loading, error, user, restorePending } = useAppSelector((s) => s.auth);

  const [form, setForm] = useState({
    email: "",
    password: "",
    rememberMe: true,
  });

  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    const saved = localStorage.getItem("salaan_theme") as Theme | null;
    if (saved) {
      setTheme(saved);
      return;
    }
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    setTheme(prefersDark ? "dark" : "light");
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("salaan_theme", theme);
  }, [theme]);

  useEffect(() => {
    if (user) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, navigate]);

  const isDark = useMemo(() => theme === "dark", [theme]);

  const handleChange = (key: keyof typeof form, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await dispatch(loginUser({ email: form.email, password: form.password }));
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10 font-sans">
      {/* soft blobs */}
      <div className="pointer-events-none absolute -left-20 top-24 h-64 w-64 rounded-full bg-blue-400/20 blur-3xl dark:bg-blue-500/15" />
      <div className="pointer-events-none absolute -right-16 bottom-20 h-72 w-72 rounded-full bg-indigo-400/15 blur-3xl dark:bg-indigo-500/10" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-200/10 blur-3xl dark:bg-blue-600/5" />

      <div className="relative w-full max-w-6xl">
        <div className="overflow-hidden rounded border border-white/70 bg-white/75 shadow-[0_25px_80px_-12px_rgba(37,99,235,0.15)] backdrop-blur-xl dark:border-slate-700/60 dark:bg-slate-900/80 dark:shadow-[0_25px_80px_-12px_rgba(0,0,0,0.45)] md:grid md:min-h-[32rem] md:grid-cols-[1.12fr,1fr]">
          {/* LEFT — form */}
          <section className="relative flex flex-col justify-between p-8 sm:p-10">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <img
                  src="/logo.png"
                  alt=""
                  className="h-10 w-auto object-contain drop-shadow-sm"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
                <span className="text-lg font-semibold tracking-wide text-slate-800 dark:text-slate-100">
                  {"Salaan "}
                  <span className="text-blue-600">Solution.</span>
                </span>
              </div>
              <button
                type="button"
                onClick={() => setTheme(isDark ? "light" : "dark")}
                className="flex h-11 w-11 items-center justify-center rounded border border-slate-200/90 bg-white/90 text-slate-600 shadow-sm transition hover:border-blue-300 hover:text-blue-600 dark:border-slate-600 dark:bg-slate-800/90 dark:text-amber-200 dark:hover:border-amber-400/50"
                aria-label="Toggle theme"
              >
                {isDark ? (
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="4" />
                    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79z" />
                  </svg>
                )}
              </button>
            </div>

            <div className="mx-auto w-full max-w-sm py-6">
              {restorePending ? (
                <p className="mb-6 rounded border border-slate-200 bg-slate-50/90 px-4 py-3 text-center text-sm text-slate-600 dark:border-slate-600 dark:bg-slate-800/50 dark:text-slate-300">
                  Checking session…
                </p>
              ) : null}
              <div className="mb-6 text-center">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-100 bg-blue-50/90 px-3 py-1 text-xs font-medium text-blue-700 dark:border-blue-500/30 dark:bg-blue-950/50 dark:text-blue-200">
                  <span aria-hidden>✨</span> Nice to see you
                </span>
                <h1 className="mt-4 text-3xl text-left font-semibold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
                  Sign in
                </h1>
                <p className="mt-2 text-sm font-light leading-relaxed text-slate-500 dark:text-slate-400">
                  Your repair center hub — jobs, sales{" & "}reports in one cozy place.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  className="flex items-center justify-center gap-2 rounded border border-slate-200/90 bg-white/80 px-3 py-3 text-sm font-medium text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md dark:border-slate-600 dark:bg-slate-800/50 dark:text-slate-200 dark:hover:border-blue-500/40"
                >
                  <FaGoogle className="h-4 w-4 shrink-0 text-blue-600" aria-hidden />
                  Google
                </button>
                <button
                  type="button"
                  className="flex items-center justify-center gap-2 rounded border border-slate-200/90 bg-white/80 px-3 py-3 text-sm font-medium text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md dark:border-slate-600 dark:bg-slate-800/50 dark:text-slate-200 dark:hover:border-blue-500/40"
                >
                  <FaApple className="h-4 w-4 shrink-0 text-blue-600" aria-hidden />
                  Apple
                </button>
              </div>

              <div className="my-6 flex items-center gap-3 text-xs font-medium text-slate-400">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-200 to-transparent dark:via-slate-600" />
                or email
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-200 to-transparent dark:via-slate-600" />
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  className={inputClass}
                  required
                />

                <input
                  type="password"
                  placeholder="Your password"
                  value={form.password}
                  onChange={(e) => handleChange("password", e.target.value)}
                  className={inputClass}
                  required
                />

                <div className="flex items-center justify-between pt-0.5 text-sm">
                  <label className="flex cursor-pointer items-center gap-2 font-medium text-slate-600 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={form.rememberMe}
                      onChange={(e) => handleChange("rememberMe", e.target.checked)}
                      className="h-4 w-4 rounded-md border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    Remember me
                  </label>

                  <button type="button" className="font-semibold text-blue-600 transition hover:text-blue-700">
                    Forgot Password?
                  </button>
                </div>

                {error && (
                  <p className="rounded border border-red-100 bg-red-50/90 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
                    {error}
                  </p>
                )}

                {user && (
                  <p className="rounded border border-emerald-100 bg-emerald-50/90 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-200">
                    Logged in as {user.fullName ?? user.email}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3.5 text-md font-semibold text-white shadow-lg shadow-blue-600/30 transition hover:from-blue-500 hover:to-blue-600 hover:shadow-xl hover:shadow-blue-600/35 active:scale-[0.98] disabled:opacity-60"
                >
                  {loading ? "Signing in…" : "Sign in"}
                </button>
              </form>
            </div>

            <div className="flex justify-between text-xs font-medium text-slate-400 dark:text-slate-500">
              <span className="cursor-pointer hover:text-blue-600">Privacy</span>
              <span>© 2026 Salaan</span>
            </div>
          </section>

          {/* RIGHT — promo */}
          <section
            className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-blue-600 via-blue-600 to-indigo-700 p-8 text-white md:flex md:p-10"
            style={{
              backgroundImage:
                "radial-gradient(circle at 2px 2px, rgba(255,255,255,0.12) 1px, transparent 0)",
              backgroundSize: "20px 20px",
            }}
          >
            <div className="absolute -right-8 top-12 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
            <div className="absolute bottom-24 -left-6 h-32 w-32 rounded-full bg-indigo-400/30 blur-2xl" />

            <div className="relative mt-6">
              <div className="rounded border border-white/20 bg-white/95 p-5 text-slate-800 shadow-2xl shadow-blue-900/20">
                <p className="text-center text-sm font-semibold text-blue-600">Today&apos;s snapshot</p>
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded bg-gradient-to-br from-blue-50 to-indigo-50/80 p-4 dark:from-slate-100 dark:to-slate-50">
                    <p className="text-xs font-medium text-slate-500">Repairs</p>
                    <p className="mt-1 text-2xl font-semibold text-slate-900">24</p>
                  </div>
                  <div className="rounded bg-gradient-to-br from-violet-50 to-blue-50/80 p-4 dark:from-slate-100 dark:to-slate-50">
                    <p className="text-xs font-medium text-slate-500">Sales</p>
                    <p className="mt-1 text-2xl font-semibold text-slate-900">$1,245</p>
                  </div>
                  <div className="col-span-2 rounded-2xl bg-slate-50 p-4 dark:bg-slate-100">
                    <p className="text-xs font-medium text-slate-500">Waiting pickup</p>
                    <p className="mt-1 text-lg font-semibold text-slate-900">9 lovely customers</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative pb-2 text-center">
              <h3 className="text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">Work calm, stay sharp</h3>
              <p className="mx-auto mt-3 max-w-xs text-sm font-light leading-relaxed text-white/90">
                Everything you need to run your shop — without the spreadsheet headache.
              </p>
              <div className="mt-6 flex justify-center gap-2">
                <span className="h-2 w-2 rounded-full bg-white/90" />
                <span className="h-2 w-2 rounded-full bg-white/40" />
                <span className="h-2 w-2 rounded-full bg-white/40" />
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
