import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UserCog, Users, Crown, UserCircle } from "lucide-react";

export default function RoleMenu({ showMenu, setShowMenu, openLogin, setLoginType }) {
  return (
    <AnimatePresence>
      {showMenu && (
        <>
          <div className="fixed inset-0 z-[99998]" onClick={() => setShowMenu(false)} />
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-3 w-64 bg-card border border-border rounded-xl shadow-2xl overflow-hidden z-[99999]"
          >
            <button onClick={() => openLogin("ceo_chro")} className="w-full flex items-center gap-3 px-4 py-4 hover:bg-primary/10 transition-colors border-b border-border/50">
              <div className="w-9 h-9 rounded-full bg-amber-500/15 flex items-center justify-center flex-shrink-0"><Crown className="w-5 h-5 text-amber-400" /></div>
              <div className="text-left"><div className="text-sm font-semibold text-foreground">CEO & CHRO Login</div><div className="text-[11px] text-muted-foreground">Executive leadership</div></div>
            </button>
            <button onClick={() => openLogin("admin")} className="w-full flex items-center gap-3 px-4 py-4 hover:bg-primary/10 transition-colors border-b border-border/50">
              <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0"><UserCog className="w-5 h-5 text-primary" /></div>
              <div className="text-left"><div className="text-sm font-semibold text-foreground">Admin Login</div><div className="text-[11px] text-muted-foreground">System administrator</div></div>
            </button>
            <button onClick={() => openLogin("recruiter")} className="w-full flex items-center gap-3 px-4 py-4 hover:bg-primary/10 transition-colors border-b border-border/50">
              <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0"><Users className="w-5 h-5 text-primary" /></div>
              <div className="text-left"><div className="text-sm font-semibold text-foreground">Recruiter Login</div><div className="text-[11px] text-muted-foreground">Talent acquisition team</div></div>
            </button>
            <button onClick={() => { setLoginType("candidate"); setShowMenu(false); }} className="w-full flex items-center gap-3 px-4 py-4 hover:bg-primary/10 transition-colors">
              <div className="w-9 h-9 rounded-full bg-green-500/15 flex items-center justify-center flex-shrink-0"><UserCircle className="w-5 h-5 text-green-400" /></div>
              <div className="text-left"><div className="text-sm font-semibold text-foreground">Candidate Login</div><div className="text-[11px] text-muted-foreground">Job seekers & applicants</div></div>
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
