import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Award } from "lucide-react";

const STATUS_COLORS = {
  "Shortlisted": "text-green-400 bg-green-400/10 border-green-400/30",
  "Interview Scheduled": "text-blue-400 bg-blue-400/10 border-blue-400/30",
  "Under Review": "text-amber-400 bg-amber-400/10 border-amber-400/30",
  "Applied": "text-muted-foreground bg-muted/20 border-border/30",
};

export default function CandidateCompareModal({ candidates, jobTitle, onClose }) {
  const top = candidates.slice(0, 3);
  const allSkills = [...new Set(top.flatMap(c => c.skills))];

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[1200] bg-black/60 backdrop-blur-sm flex items-center justify-center px-4"
        onClick={onClose}>
        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
          onClick={e => e.stopPropagation()}
          className="w-full max-w-3xl bg-card border border-border rounded-2xl p-6 max-h-[90vh] overflow-y-auto">

          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-semibold text-foreground">Candidate Comparison</h3>
              <p className="font-mono text-[10px] text-muted-foreground mt-0.5 uppercase tracking-wider">{jobTitle}</p>
            </div>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Candidate columns */}
          <div className={`grid gap-4 mb-6`} style={{ gridTemplateColumns: `repeat(${top.length}, 1fr)` }}>
            {top.map((c, i) => (
              <div key={i} className={`rounded-xl border p-4 ${i === 0 ? "border-primary/50 bg-primary/5" : "border-border/40 bg-card/40"}`}>
                {i === 0 && (
                  <div className="flex items-center gap-1 mb-2">
                    <Award className="w-3.5 h-3.5 text-amber-400" />
                    <span className="font-mono text-[9px] text-amber-400 uppercase tracking-wider">Top Match</span>
                  </div>
                )}
                <div className="w-10 h-10 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center font-bold text-primary mb-3">
                  {c.name[0]}
                </div>
                <div className="font-semibold text-sm text-foreground mb-1">{c.name}</div>
                <div className="font-mono text-[10px] text-muted-foreground mb-3">{c.applied}</div>

                {/* AI Score ring */}
                <div className="flex items-center gap-2 mb-3">
                  <div className="relative w-12 h-12 flex-shrink-0">
                    <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                      <circle cx="18" cy="18" r="14" fill="none" stroke="hsl(190,90%,50%,0.1)" strokeWidth="3" />
                      <motion.circle cx="18" cy="18" r="14" fill="none" stroke="hsl(190,90%,50%)" strokeWidth="3"
                        strokeLinecap="round"
                        initial={{ strokeDasharray: "0 88" }}
                        animate={{ strokeDasharray: `${c.score * 0.88} 88` }}
                        transition={{ duration: 0.8, delay: i * 0.1 }} />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="font-mono text-[10px] font-bold text-primary">{c.score}%</span>
                    </div>
                  </div>
                  <div>
                    <div className="font-mono text-[9px] text-muted-foreground uppercase">AI Score</div>
                    <span className={`font-mono text-[9px] px-1.5 py-0.5 rounded-full border ${STATUS_COLORS[c.status]}`}>{c.status}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Skills matrix */}
          <div className="bg-background/40 border border-border/30 rounded-xl p-4">
            <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider mb-3">Skills Matrix</div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr>
                    <th className="text-left font-mono text-[10px] text-muted-foreground pb-2 pr-4">Skill</th>
                    {top.map((c, i) => (
                      <th key={i} className="text-center font-mono text-[10px] text-muted-foreground pb-2 px-2">{c.name.split(" ")[0]}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {allSkills.map(skill => (
                    <tr key={skill} className="border-t border-border/20">
                      <td className="py-2 pr-4 font-mono text-[11px] text-foreground">{skill}</td>
                      {top.map((c, i) => (
                        <td key={i} className="py-2 px-2 text-center">
                          {c.skills.includes(skill)
                            ? <span className="text-green-400 text-base leading-none">✓</span>
                            : <span className="text-muted-foreground/30 text-base leading-none">—</span>}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}