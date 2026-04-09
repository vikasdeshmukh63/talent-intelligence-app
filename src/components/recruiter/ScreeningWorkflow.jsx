import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Zap, UserX, Mail, CheckCircle2, RefreshCw, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/api/client";

const THRESHOLD_OPTIONS = [60, 70, 75, 80, 85];

export default function ScreeningWorkflow({ candidates, jobTitle, onStatusUpdate, onClose }) {
  const [threshold, setThreshold] = useState(75);
  const [showDropdown, setShowDropdown] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [emailPreviews, setEmailPreviews] = useState({});
  const [generatingEmails, setGeneratingEmails] = useState(false);
  const [done, setDone] = useState(false);

  const belowThreshold = candidates.filter(c => c.score < threshold && c.status !== "Rejected");
  const aboveThreshold = candidates.filter(c => c.score >= threshold);

  const generateRejectionEmails = async () => {
    setGeneratingEmails(true);
    const previews = {};
    await Promise.all(belowThreshold.map(async (c) => {
      const res = await apiClient.integrations.Core.InvokeLLM({
        prompt: `Write a brief, warm rejection email to ${c.name} for the "${jobTitle}" role. Mention their skills: ${c.skills.join(", ")}. Encourage them to apply for future roles. Sign off as "Priya Mehta, Recruiter, ESDS eNlight Talent". Keep it under 80 words.`,
      });
      previews[c.name] = res;
    }));
    setEmailPreviews(previews);
    setGeneratingEmails(false);
  };

  const handleRejectAll = () => {
    setRejecting(true);
    belowThreshold.forEach(c => onStatusUpdate(jobTitle, c.name, "Rejected"));
    setTimeout(() => { setDone(true); }, 400);
  };

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[1200] bg-black/60 backdrop-blur-sm flex items-center justify-center px-4"
        onClick={onClose}>
        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
          onClick={e => e.stopPropagation()}
          className="w-full max-w-lg bg-card border border-border rounded-2xl p-6 max-h-[90vh] overflow-y-auto">

          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" /> Automated Screening
              </h3>
              <p className="font-mono text-[10px] text-muted-foreground mt-0.5 uppercase tracking-wider">{jobTitle}</p>
            </div>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
          </div>

          {done ? (
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              className="flex flex-col items-center py-10 gap-3">
              <CheckCircle2 className="w-12 h-12 text-green-400" />
              <p className="font-semibold text-foreground">{belowThreshold.length} candidates moved to Rejected</p>
              <p className="font-mono text-xs text-muted-foreground text-center">Status updated automatically</p>
              <Button onClick={onClose} size="sm" className="mt-2 bg-primary hover:bg-primary/90">Done</Button>
            </motion.div>
          ) : (
            <>
              {/* Threshold selector */}
              <div className="bg-background/50 border border-border/40 rounded-xl p-4 mb-5">
                <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider mb-3">AI Score Threshold</div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs text-muted-foreground">Reject candidates below</span>
                  <div className="relative">
                    <button onClick={() => setShowDropdown(!showDropdown)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-primary/40 bg-primary/10 text-primary font-mono text-sm font-bold">
                      {threshold}% <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                    <AnimatePresence>
                      {showDropdown && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setShowDropdown(false)} />
                          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                            className="absolute left-0 top-full mt-1 bg-card border border-border rounded-xl overflow-hidden shadow-xl z-20 w-24">
                            {THRESHOLD_OPTIONS.map(t => (
                              <button key={t} onClick={() => { setThreshold(t); setShowDropdown(false); setEmailPreviews({}); }}
                                className={`w-full text-left px-3 py-2 font-mono text-xs transition-colors hover:bg-muted/30 ${threshold === t ? "text-primary bg-primary/10" : "text-muted-foreground"}`}>
                                {t}%
                              </button>
                            ))}
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                <div className="flex gap-4 mt-3">
                  <div className="flex-1 bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-center">
                    <div className="font-bold text-lg text-red-400">{belowThreshold.length}</div>
                    <div className="font-mono text-[9px] text-muted-foreground uppercase">To Reject</div>
                  </div>
                  <div className="flex-1 bg-green-500/10 border border-green-500/20 rounded-lg p-3 text-center">
                    <div className="font-bold text-lg text-green-400">{aboveThreshold.length}</div>
                    <div className="font-mono text-[9px] text-muted-foreground uppercase">To Advance</div>
                  </div>
                </div>
              </div>

              {/* Candidates to reject */}
              {belowThreshold.length > 0 && (
                <div className="mb-5">
                  <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Candidates Below Threshold</div>
                  <div className="space-y-2">
                    {belowThreshold.map((c, i) => (
                      <div key={i} className="flex items-center justify-between bg-red-500/5 border border-red-500/15 rounded-lg px-3 py-2">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center font-bold text-red-400 text-xs flex-shrink-0">{c.name[0]}</div>
                          <span className="font-mono text-xs text-foreground">{c.name}</span>
                        </div>
                        <span className="font-mono text-xs font-bold text-red-400">{c.score}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Email previews */}
              {Object.keys(emailPreviews).length > 0 && (
                <div className="mb-5 space-y-2">
                  <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Mail className="w-3 h-3" /> Rejection Email Previews
                  </div>
                  {Object.entries(emailPreviews).map(([name, body]) => (
                    <div key={name} className="bg-background/40 border border-border/30 rounded-xl p-3">
                      <div className="font-mono text-[10px] text-primary mb-1.5">To: {name}</div>
                      <p className="font-sans text-[10px] text-muted-foreground leading-relaxed">{body}</p>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-2">
                {belowThreshold.length > 0 && Object.keys(emailPreviews).length === 0 && (
                  <Button onClick={generateRejectionEmails} disabled={generatingEmails} variant="outline"
                    className="flex-1 border-primary/30 text-primary hover:bg-primary/10 gap-2 text-xs">
                    {generatingEmails
                      ? <><motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}><RefreshCw className="w-3.5 h-3.5" /></motion.span> Generating emails...</>
                      : <><Mail className="w-3.5 h-3.5" /> Preview Rejection Emails</>}
                  </Button>
                )}
                <Button onClick={handleRejectAll} disabled={belowThreshold.length === 0 || rejecting}
                  className="flex-1 bg-red-500/80 hover:bg-red-500 gap-2 text-xs">
                  <UserX className="w-3.5 h-3.5" /> Reject {belowThreshold.length} Candidates
                </Button>
              </div>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}