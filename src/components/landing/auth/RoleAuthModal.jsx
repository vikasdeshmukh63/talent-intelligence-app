import React from "react";
import { motion } from "framer-motion";
import { X, UserCog, Users, Crown, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function RoleAuthModal(props) {
  const {
    theme, loginType, closeAll, authMode, setAuthMode, setFullName, setConfirmPassword, fullName,
    userId, setUserId, employeeId, setEmployeeId, showVerify, showForgot, password, setPassword,
    confirmPassword, otp, setOtp, newPassword, setNewPassword, handleLogin, isSubmitting,
    handleVerifyOtp, handleForgotPassword, authError, apiClient, selectedPosition, setSelectedPosition
  } = props;

  if (!loginType || loginType === "candidate") return null;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[1000] flex items-start justify-center overflow-y-auto py-6 px-4" style={{ background: theme === "light" ? "#ffffff" : "hsl(218,45%,6%)" }}>
      <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: theme === "light" ? "linear-gradient(#003d82 1px, transparent 1px), linear-gradient(90deg, #003d82 1px, transparent 1px)" : "linear-gradient(hsl(190,90%,50%) 1px, transparent 1px), linear-gradient(90deg, hsl(190,90%,50%) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />
      <button onClick={closeAll} className="fixed top-4 right-4 text-muted-foreground hover:text-foreground transition-colors z-20"><X className="w-6 h-6" /></button>
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 30 }} transition={{ duration: 0.3 }} className="relative z-10 w-full max-w-xs mx-auto mt-auto mb-auto">
        <div className="flex flex-col items-center mb-8">
          <img src="/vite.svg" alt="ESDS Logo" className="w-24 h-24 sm:w-36 sm:h-36 object-contain mb-4" />
          {loginType === "ceo_chro" ? (
            <>
              <div className="flex items-center gap-3 mb-2"><div className="p-2 rounded-lg" style={{ background: theme === "light" ? "rgba(180,83,9,0.15)" : "rgba(217,119,6,0.15)" }}><Crown className="w-6 h-6" style={{ color: theme === "light" ? "#B45309" : "#F59E0B" }} /></div><h2 className="font-display text-3xl font-bold text-foreground">Executive Portal</h2></div>
              <p className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground mb-4">CEO & CHRO Leadership Access</p>
            </>
          ) : (
            <div className="flex items-center gap-2 mb-1">{loginType === "admin" ? <UserCog className="w-5 h-5 text-primary" /> : <Users className="w-5 h-5 text-primary" />}<h2 className="font-display text-2xl font-bold text-foreground">{loginType === "admin" ? "Admin Login" : "Recruiter Login"}</h2></div>
          )}
        </div>
        <div className="backdrop-blur rounded-2xl p-5 space-y-3" style={{ background: theme === "light" ? "rgba(255,255,255,0.98)" : "hsl(222,55%,6%,0.7)", border: theme === "light" ? "1px solid rgba(0,61,130,0.15)" : "1px solid hsl(222,40%,12%,0.8)" }}>
          <div className="flex gap-1 rounded-xl p-1 mb-2" style={{ background: theme === "light" ? "rgba(0,61,130,0.08)" : "hsl(222,50%,8%,0.4)" }}>
            {["login", "signup"].map((mode) => <button key={mode} onClick={() => { setAuthMode(mode); setFullName(""); setConfirmPassword(""); }} className="flex-1 py-2 rounded-lg text-xs font-mono uppercase tracking-wider">{mode}</button>)}
          </div>
          {loginType === "ceo_chro" && <div className="relative"><select value={selectedPosition} onChange={(e) => setSelectedPosition(e.target.value)} className="w-full h-10 rounded-lg border px-4 py-2 text-sm appearance-none"><option value="CEO">CEO</option><option value="CHRO">CHRO</option></select><ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" /></div>}
          {authMode === "signup" && <Input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Full Name" className="text-sm border rounded-lg" />}
          <Input type="email" value={userId} onChange={(e) => setUserId(e.target.value)} placeholder="Email" className="text-sm border rounded-lg" />
          <Input value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} placeholder="Employee ID" className="text-sm border rounded-lg" />
          {!showVerify && !showForgot && <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className="text-sm border rounded-lg" />}
          {!showVerify && !showForgot && authMode === "signup" && <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm Password" className="text-sm border rounded-lg" />}
          {(showVerify || showForgot) && <Input value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="OTP" className="text-sm border rounded-lg" />}
          {showForgot && <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="New Password" className="text-sm border rounded-lg" />}
          {!showVerify && !showForgot && <Button onClick={handleLogin} disabled={isSubmitting} className="w-full">{isSubmitting ? "Please wait..." : authMode === "login" ? "Login" : "Create Account"}</Button>}
          {showVerify && <Button onClick={handleVerifyOtp} disabled={isSubmitting || !otp.trim()} className="w-full">Verify Email OTP</Button>}
          {showForgot && <Button onClick={handleForgotPassword} disabled={isSubmitting || !otp.trim() || !newPassword.trim()} className="w-full">Reset Password</Button>}
          {authError && <p className="text-center text-[11px] text-red-400">{authError}</p>}
          {!showVerify && <button onClick={handleForgotPassword} className="text-[11px] text-primary hover:underline">{showForgot ? "Send OTP Again" : "Forgot Password?"}</button>}
          {showVerify && <button onClick={async () => { await apiClient.auth.resendVerifyOtp({ email: userId }); }} className="text-[11px] text-primary hover:underline">Resend OTP</button>}
        </div>
      </motion.div>
    </motion.div>
  );
}
