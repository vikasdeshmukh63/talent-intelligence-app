import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, User, Mail, Phone, MapPin, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/lib/ThemeContext";
import { apiClient } from "@/api/client";

const ESDS_LOGO = "/vite.svg";

export default function CandidateLoginModal({ onClose, onLogin }) {
  const { theme } = useTheme();
  const [authMode, setAuthMode] = useState("login");
  const [form, setForm] = useState({ name: "Arjun Kapoor", email: "arjun@email.com", phone: "+91 98765 43210", location: "Mumbai, India" });
  const [password, setPassword] = useState("candidate123");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [showVerify, setShowVerify] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.email.trim()) return;
    if (authMode === "signup" && password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setIsSubmitting(true);
    setError("");
    try {
      const payload = {
        name: form.name,
        email: form.email,
        password,
        role: "candidate",
        phone: form.phone,
        location: form.location,
      };
      const user =
        authMode === "signup"
          ? await apiClient.auth.signup(payload)
          : await apiClient.auth.login({ email: form.email, password, role: "candidate" });
      if (authMode === "signup") {
        setShowVerify(true);
      } else {
        onLogin(user);
      }
    } catch (e) {
      setError(e.message || "Authentication failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerify = async () => {
    if (!otp.trim()) return;
    setIsSubmitting(true);
    setError("");
    try {
      const user = await apiClient.auth.verifyEmailOtp({ email: form.email, otp });
      onLogin(user);
    } catch (e) {
      setError(e.message || "OTP verification failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = async () => {
    setIsSubmitting(true);
    setError("");
    try {
      if (!showForgot) {
        await apiClient.auth.forgotPassword({ email: form.email });
        setShowForgot(true);
      } else {
        await apiClient.auth.resetPassword({ email: form.email, otp, newPassword });
        setShowForgot(false);
        setOtp("");
        setNewPassword("");
      }
    } catch (e) {
      setError(e.message || "Password reset failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const fields = [
    { key: "name", label: "Full Name", icon: <User className="w-4 h-4" />, placeholder: "e.g. Arjun Kapoor", type: "text", required: true },
    { key: "email", label: "Email Address", icon: <Mail className="w-4 h-4" />, placeholder: "e.g. arjun@email.com", type: "email", required: true },
    { key: "phone", label: "Phone Number", icon: <Phone className="w-4 h-4" />, placeholder: "e.g. +91 98765 43210", type: "tel", required: false },
    { key: "location", label: "Location", icon: <MapPin className="w-4 h-4" />, placeholder: "e.g. Mumbai, India", type: "text", required: false },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[1000] flex items-start justify-center overflow-y-auto py-6 px-4"
      style={{ background: theme === 'light' ? "#ffffff" : "hsl(218,45%,6%)" }}>

      <div className="absolute inset-0 opacity-[0.04]"
        style={{ backgroundImage: theme === 'light' ? "linear-gradient(#003d82 1px, transparent 1px), linear-gradient(90deg, #003d82 1px, transparent 1px)" : "linear-gradient(hsl(190,90%,50%) 1px, transparent 1px), linear-gradient(90deg, hsl(190,90%,50%) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />

      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-10 pointer-events-none"
        style={{ background: theme === 'light' ? "radial-gradient(circle, #003d82, transparent 70%)" : "radial-gradient(circle, hsl(190,90%,50%), transparent 70%)" }} />

      <button onClick={onClose} className="fixed top-4 right-4 text-muted-foreground hover:text-foreground transition-colors z-20">
        <X className="w-6 h-6" />
      </button>

      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 30 }}
        transition={{ duration: 0.3 }}
        className="relative z-10 w-full max-w-sm mx-auto mt-auto mb-auto">

        <div className="flex flex-col items-center mb-6">
          <img src={ESDS_LOGO} alt="ESDS Logo" className="w-20 h-20 sm:w-28 sm:h-28 object-contain mb-3" />
          <div className="flex items-center gap-2 mb-1">
            <User className="w-5 h-5 text-primary" />
            <h2 className="font-display text-2xl font-bold text-foreground">Candidate Login</h2>
          </div>
          <p className="font-mono text-[11px] tracking-widest uppercase text-muted-foreground">
            ESDS eNlight Talent Platform
          </p>
        </div>

        {/* Login / Sign Up tabs */}
        <div className="flex gap-1 rounded-xl p-1 mb-5" style={{ background: theme === 'light' ? 'rgba(0,61,130,0.08)' : 'hsl(222,50%,8%,0.4)', border: theme === 'light' ? '1px solid rgba(0,61,130,0.2)' : '1px solid hsl(222,40%,12%,0.3)' }}>
          {["login", "signup"].map(mode => (
            <button key={mode} onClick={() => setAuthMode(mode)}
              style={authMode === mode ? { background: theme === 'light' ? '#003d82' : 'hsl(220,80%,30%)', color: '#ffffff' } : { color: theme === 'light' ? '#003d82' : 'hsl(210,20%,60%)' }}
              className={`flex-1 py-2 rounded-lg text-xs font-mono uppercase tracking-wider transition-all ${authMode !== mode ? 'hover:text-foreground' : ''}`}>
              {mode === "login" ? "Login" : "Sign Up"}
            </button>
          ))}
        </div>

        <div className="backdrop-blur rounded-2xl p-6 space-y-4" style={{ background: theme === 'light' ? 'rgba(255,255,255,0.98)' : 'hsl(222,55%,6%,0.7)', border: theme === 'light' ? '1px solid rgba(0,61,130,0.15)' : '1px solid hsl(222,40%,12%,0.8)' }}>
          {!showVerify && fields.map(f => {
            if (authMode === "login" && !f.required) return null;
            return (
              <div key={f.key}>
                <label style={{ color: theme === 'light' ? '#003d82' : 'hsl(210,20%,60%)' }} className="text-[11px] mb-1 block font-bold uppercase tracking-wider">
                  {f.label} {f.required && <span className="text-red-400">*</span>}
                </label>
                <Input
                  type={f.type}
                  value={form[f.key]}
                  onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                  placeholder={f.placeholder}
                  style={{ background: theme === 'light' ? 'rgba(0,61,130,0.08)' : 'hsl(222,40%,12%,0.6)', color: theme === 'light' ? '#003d82' : 'hsl(210,40%,98%)', borderColor: theme === 'light' ? 'rgba(0,61,130,0.2)' : 'hsl(222,40%,12%)' }}
                  className="text-sm border"
                />
              </div>
            );
          })}

          {!showVerify && !showForgot && <div>
            <label style={{ color: theme === 'light' ? '#003d82' : 'hsl(210,20%,60%)' }} className="text-[11px] mb-1 block font-bold uppercase tracking-wider">Password <span className="text-red-400">*</span></label>
            <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter password" style={{ background: theme === 'light' ? 'rgba(0,61,130,0.08)' : 'hsl(222,40%,12%,0.6)', color: theme === 'light' ? '#003d82' : 'hsl(210,40%,98%)', borderColor: theme === 'light' ? 'rgba(0,61,130,0.2)' : 'hsl(222,40%,12%)' }} className="text-sm border" />
          </div>}
          {!showVerify && !showForgot && authMode === "signup" && (
            <div>
              <label style={{ color: theme === 'light' ? '#003d82' : 'hsl(210,20%,60%)' }} className="text-[11px] mb-1 block font-bold uppercase tracking-wider">Confirm Password <span className="text-red-400">*</span></label>
              <Input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Confirm password" style={{ background: theme === 'light' ? 'rgba(0,61,130,0.08)' : 'hsl(222,40%,12%,0.6)', color: theme === 'light' ? '#003d82' : 'hsl(210,40%,98%)', borderColor: theme === 'light' ? 'rgba(0,61,130,0.2)' : 'hsl(222,40%,12%)' }} className="text-sm border" />
            </div>
          )}
          {(showVerify || showForgot) && (
            <div>
              <label style={{ color: theme === 'light' ? '#003d82' : 'hsl(210,20%,60%)' }} className="text-[11px] mb-1 block font-bold uppercase tracking-wider">OTP</label>
              <Input value={otp} onChange={e => setOtp(e.target.value)} placeholder="Enter 6-digit OTP" className="text-sm border" />
            </div>
          )}
          {showForgot && (
            <div>
              <label style={{ color: theme === 'light' ? '#003d82' : 'hsl(210,20%,60%)' }} className="text-[11px] mb-1 block font-bold uppercase tracking-wider">New Password</label>
              <Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="New password" className="text-sm border" />
            </div>
          )}

          {error && <p className="text-xs text-red-400">{error}</p>}
          {!showVerify && !showForgot && <Button onClick={handleSubmit} disabled={!form.name.trim() || !form.email.trim() || isSubmitting}
            style={{ background: theme === 'light' ? '#003d82' : 'hsl(220,80%,30%)', color: '#ffffff' }}
            className="w-full text-sm mt-2 gap-2 hover:opacity-90">
            {isSubmitting ? "Please wait..." : authMode === "login" ? "Login" : "Create Account"} <ArrowRight className="w-4 h-4" />
          </Button>}
          {showVerify && <Button onClick={handleVerify} disabled={isSubmitting || !otp.trim()} className="w-full text-sm mt-2">Verify Email OTP</Button>}
          {showForgot && <Button onClick={handleForgotPassword} disabled={isSubmitting || !otp.trim() || !newPassword.trim()} className="w-full text-sm mt-2">Reset Password</Button>}
          {!showVerify && <button onClick={handleForgotPassword} className="text-xs text-primary hover:underline">{showForgot ? "Send OTP Again" : "Forgot Password?"}</button>}
          {showVerify && <button onClick={async ()=>{await apiClient.auth.resendVerifyOtp({email: form.email});}} className="text-xs text-primary hover:underline">Resend OTP</button>}
          <p style={{ color: theme === 'light' ? '#003d82' : 'hsl(210,20%,60%)' }} className="text-center text-[10px]">
            {authMode === "login" ? (
              <>Don't have an account?{" "}
                <button onClick={() => setAuthMode("signup")} style={{ color: theme === 'light' ? '#003d82' : '#22d3ee' }} className="hover:underline font-bold">Sign Up</button>
              </>
            ) : (
              <>Already have an account?{" "}
                <button onClick={() => setAuthMode("login")} style={{ color: theme === 'light' ? '#003d82' : '#22d3ee' }} className="hover:underline font-bold">Login</button>
              </>
            )}
          </p>
        </div>

        <p className="text-center text-xs text-muted-foreground/50 mt-6 font-mono tracking-wider">
          Powered by eNlight AI · Enterprise-Grade Sovereign AI
        </p>
      </motion.div>
    </motion.div>
  );
}