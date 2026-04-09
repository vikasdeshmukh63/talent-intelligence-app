import React, { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { apiClient } from "@/api/client";
import { useTheme } from "@/lib/ThemeContext";
import { Sparkles, ArrowRight, Mail, Lock, User, KeyRound } from "lucide-react";

const roleMap = {
  candidate: "candidate",
  recruiter: "recruiter",
  interviewer: "interviewer",
  admin: "admin",
  "ceo-chro": "ceo_chro",
};

const ROLE_OPTIONS = [
  { routeKey: "candidate", label: "Candidate" },
  { routeKey: "recruiter", label: "Recruiter" },
  { routeKey: "interviewer", label: "Interviewer" },
  { routeKey: "admin", label: "Admin" },
  { routeKey: "ceo-chro", label: "CEO / CHRO" },
];

export default function AuthPage() {
  const navigate = useNavigate();
  const { role: routeRole } = useParams();
  const { theme } = useTheme();
  const role = useMemo(() => roleMap[routeRole] || "candidate", [routeRole]);
  const roleLabel = useMemo(
    () => ROLE_OPTIONS.find((o) => o.routeKey === routeRole)?.label || "Candidate",
    [routeRole]
  );

  const [mode, setMode] = useState("login");
  const [step, setStep] = useState("auth");
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    otp: "",
    newPassword: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const redirectByRole = (userRole) => {
    const map = {
      candidate: "/dashboard/candidate",
      recruiter: "/dashboard/recruiter",
      interviewer: "/dashboard/interviewer",
      admin: "/dashboard/admin",
      ceo_chro: "/dashboard/ceo-chro",
    };
    navigate(map[userRole] || "/", { replace: true });
  };

  const submitAuth = async () => {
    setError("");
    if (!form.email || !form.password) return;
    if (mode === "signup" && form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      if (mode === "signup") {
        await apiClient.auth.signup({
          name: form.name || "User",
          email: form.email,
          password: form.password,
          role,
        });
        setStep("verify");
      } else {
        const user = await apiClient.auth.login({ email: form.email, password: form.password, role });
        redirectByRole(user.role);
      }
    } catch (e) {
      setError(e.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const submitVerify = async () => {
    setLoading(true);
    setError("");
    try {
      const user = await apiClient.auth.verifyEmailOtp({ email: form.email, otp: form.otp });
      redirectByRole(user.role);
    } catch (e) {
      setError(e.message || "OTP verification failed");
    } finally {
      setLoading(false);
    }
  };

  const submitForgot = async () => {
    setLoading(true);
    setError("");
    try {
      if (step === "forgot") {
        await apiClient.auth.forgotPassword({ email: form.email });
        setStep("reset");
      } else {
        await apiClient.auth.resetPassword({ email: form.email, otp: form.otp, newPassword: form.newPassword });
        setStep("auth");
      }
    } catch (e) {
      setError(e.message || "Password flow failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden"
      style={{ background: theme === "light" ? "#ffffff" : "hsl(218,45%,6%)" }}
    >
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            theme === "light"
              ? "linear-gradient(#003d82 1px, transparent 1px), linear-gradient(90deg, #003d82 1px, transparent 1px)"
              : "linear-gradient(hsl(190,90%,50%) 1px, transparent 1px), linear-gradient(90deg, hsl(190,90%,50%) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full opacity-10 pointer-events-none"
        style={{
          background:
            theme === "light"
              ? "radial-gradient(circle, #003d82, transparent 70%)"
              : "radial-gradient(circle, hsl(190,90%,50%), transparent 70%)",
        }}
      />

      <div
        className="w-full max-w-md rounded-2xl p-6 space-y-5 relative z-10"
        style={{
          background: theme === "light" ? "rgba(255,255,255,0.98)" : "hsl(222,55%,6%,0.7)",
          border: theme === "light" ? "1px solid rgba(0,61,130,0.15)" : "1px solid hsl(222,40%,12%,0.8)",
        }}
      >
        <div className="text-center mb-1">
          <img src="/vite.svg" alt="ESDS Logo" className="w-16 h-16 object-contain mx-auto mb-2" />
          <h1 className="text-xl font-semibold text-foreground">{roleLabel} · Authentication</h1>
          <p className="text-[11px] uppercase tracking-widest text-muted-foreground font-mono mt-1">ESDS eNlight Talent Platform</p>
        </div>

        {step === "auth" && (
          <>
            <div>
              <label htmlFor="auth-role" className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-1.5 block">
                Role
              </label>
              <select
                id="auth-role"
                value={ROLE_OPTIONS.some((o) => o.routeKey === routeRole) ? routeRole : "candidate"}
                onChange={(e) => navigate(`/auth/${e.target.value}`, { replace: true })}
                className="w-full rounded-lg border border-input bg-background/40 px-3 py-2.5 text-sm text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-ring appearance-none cursor-pointer"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "right 0.75rem center",
                  paddingRight: "2.25rem",
                }}
              >
                {ROLE_OPTIONS.map((o) => (
                  <option key={o.routeKey} value={o.routeKey}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-1 rounded-xl p-1" style={{ background: theme === "light" ? "rgba(0,61,130,0.08)" : "hsl(222,50%,8%,0.4)" }}>
              {["login", "signup"].map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className="flex-1 py-2 rounded-lg text-xs font-mono uppercase tracking-wider transition-all"
                  style={mode === m ? { background: theme === "light" ? "#003d82" : "hsl(220,80%,30%)", color: "#fff" } : {}}
                >
                  {m}
                </button>
              ))}
            </div>
            {mode === "signup" && (
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input className="w-full border rounded-lg p-2 pl-9 bg-background/40" placeholder="Full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
            )}
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input className="w-full border rounded-lg p-2 pl-9 bg-background/40" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input className="w-full border rounded-lg p-2 pl-9 bg-background/40" type="password" placeholder="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            </div>
            {mode === "signup" && (
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input className="w-full border rounded-lg p-2 pl-9 bg-background/40" type="password" placeholder="Confirm password" value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} />
              </div>
            )}
            <button className="w-full rounded-lg p-2 text-white text-sm flex items-center justify-center gap-2" style={{ background: theme === "light" ? "#003d82" : "hsl(220,80%,30%)" }} onClick={submitAuth} disabled={loading}>
              {loading ? "Please wait..." : mode === "login" ? "Login" : "Sign Up"} <ArrowRight className="w-4 h-4" />
            </button>
            <div className="flex items-center justify-between gap-4 pt-1">
              <button className="text-xs underline text-primary" onClick={() => setMode(mode === "login" ? "signup" : "login")}>
                {mode === "login" ? "Create account" : "Already have account? Login"}
              </button>
              <button className="text-xs underline text-primary" onClick={() => setStep("forgot")}>Forgot password</button>
              <Link to="/" className="text-xs underline text-primary">Back to Landing</Link>
            </div>
          </>
        )}
        {step === "verify" && (
          <>
            <div className="relative">
              <KeyRound className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input className="w-full border rounded-lg p-2 pl-9 bg-background/40" placeholder="OTP" value={form.otp} onChange={(e) => setForm({ ...form, otp: e.target.value })} />
            </div>
            <button className="w-full rounded-lg p-2 text-white text-sm flex items-center justify-center gap-2" style={{ background: theme === "light" ? "#003d82" : "hsl(220,80%,30%)" }} onClick={submitVerify} disabled={loading}>{loading ? "Please wait..." : "Verify Email OTP"} <Sparkles className="w-4 h-4" /></button>
            <button className="text-xs underline text-primary" onClick={() => apiClient.auth.resendVerifyOtp({ email: form.email })}>Resend OTP</button>
          </>
        )}
        {(step === "forgot" || step === "reset") && (
          <>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input className="w-full border rounded-lg p-2 pl-9 bg-background/40" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            {step === "reset" && (
              <>
                <div className="relative">
                  <KeyRound className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input className="w-full border rounded-lg p-2 pl-9 bg-background/40" placeholder="OTP" value={form.otp} onChange={(e) => setForm({ ...form, otp: e.target.value })} />
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input className="w-full border rounded-lg p-2 pl-9 bg-background/40" type="password" placeholder="New password" value={form.newPassword} onChange={(e) => setForm({ ...form, newPassword: e.target.value })} />
                </div>
              </>
            )}
            <button className="w-full rounded-lg p-2 text-white text-sm" style={{ background: theme === "light" ? "#003d82" : "hsl(220,80%,30%)" }} onClick={submitForgot} disabled={loading}>{loading ? "Please wait..." : step === "forgot" ? "Send Reset OTP" : "Reset Password"}</button>
          </>
        )}
        {error && <p className="text-sm text-red-500">{error}</p>}
        {step !== "auth" && (
          <div className="pt-1 flex justify-center">
            <Link to="/" className="text-xs underline block text-primary text-center">Back to Landing</Link>
          </div>
        )}
      </div>
    </div>
  );
}
