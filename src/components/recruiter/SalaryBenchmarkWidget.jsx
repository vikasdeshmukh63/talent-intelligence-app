import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, RefreshCw, TrendingUp, X, IndianRupee } from "lucide-react";
import { apiClient } from "@/api/client";

export default function SalaryBenchmarkWidget({ candidate, jobTitle, recruiterBudget }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const fetchBenchmark = async () => {
    if (data) { setOpen(true); return; }
    setLoading(true);
    setOpen(true);
    const res = await apiClient.integrations.Core.InvokeLLM({
      prompt: `You are a compensation analyst specializing in Indian tech industry salaries.
Analyze the following candidate and role, then suggest three salary tiers in INR (Lakhs Per Annum - LPA).

Candidate: ${candidate.name}
Role: ${jobTitle}
Skills: ${candidate.skills.join(", ")}
AI Match Score: ${candidate.score}%
Current Status: ${candidate.status}
${recruiterBudget ? `Recruiter's Approved Budget: ₹${recruiterBudget} LPA` : ""}

Return a JSON with:
- low_lpa: conservative/low salary offer (number)
- medium_lpa: standard market salary (number)
- high_lpa: competitive/high salary offer (number)
- market_trend: one of "Rising", "Stable", "Declining"
- confidence: one of "High", "Medium", "Low"
- rationale: one sentence explaining the range
- top_driver: the single biggest factor driving the salary`,
      response_json_schema: {
        type: "object",
        properties: {
          low_lpa: { type: "number" },
          medium_lpa: { type: "number" },
          high_lpa: { type: "number" },
          market_trend: { type: "string" },
          confidence: { type: "string" },
          rationale: { type: "string" },
          top_driver: { type: "string" },
        },
      },
    });
    setData(res);
    setLoading(false);
  };

  const trendColor = { Rising: "text-green-400", Stable: "text-amber-400", Declining: "text-red-400" };
  const confidenceColor = { High: "text-green-400", Medium: "text-amber-400", Low: "text-red-400" };

  const TIERS = data ? [
    { label: "Low", lpa: data.low_lpa, color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20", bar: "bg-red-400/60" },
    { label: "Medium", lpa: data.medium_lpa, color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20", bar: "bg-amber-400/60" },
    { label: "High", lpa: data.high_lpa, color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20", bar: "bg-emerald-400/70" },
  ] : [];

  const maxLpa = data ? data.high_lpa : 1;

  return (
    <div className="mt-2">
      {!open ? (
        <button
          onClick={fetchBenchmark}
          className="flex items-center gap-1.5 text-[11px] font-mono text-emerald-400 border border-emerald-400/30 hover:bg-emerald-400/10 rounded-lg px-3 py-1.5 transition-all"
        >
          <IndianRupee className="w-3 h-3" /> AI Salary Benchmark
        </button>
      ) : (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            className="bg-emerald-950/30 border border-emerald-500/20 rounded-xl p-4 mt-1"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5">
                <IndianRupee className="w-3.5 h-3.5 text-emerald-400" />
                <span className="font-mono text-[10px] text-emerald-400 uppercase tracking-wider">AI Salary Benchmark</span>
              </div>
              <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {loading ? (
              <div className="flex items-center gap-2 text-[11px] font-mono text-muted-foreground py-3 justify-center">
                <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                  <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
                </motion.span>
                Analyzing market data...
              </div>
            ) : data && (
              <>
                {/* Recruiter Budget badge */}
                {recruiterBudget && (
                  <div className="flex items-center gap-2 bg-blue-900/20 border border-blue-500/20 rounded-lg px-3 py-1.5 mb-3">
                    <IndianRupee className="w-3 h-3 text-blue-400" />
                    <span className="font-mono text-[9px] text-muted-foreground uppercase">Recruiter Budget:</span>
                    <span className="font-mono text-[11px] font-bold text-blue-400">₹{recruiterBudget} LPA</span>
                  </div>
                )}

                {/* Three tier bars */}
                <div className="space-y-2 mb-4">
                  {TIERS.map((tier, i) => (
                    <motion.div key={tier.label}
                      initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className={`flex items-center gap-3 ${tier.bg} border ${tier.border} rounded-lg px-3 py-2`}
                    >
                      <span className={`font-mono text-[10px] font-bold w-12 flex-shrink-0 ${tier.color}`}>{tier.label}</span>
                      <div className="flex-1 h-2 bg-muted/20 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${(tier.lpa / maxLpa) * 100}%` }}
                          transition={{ duration: 0.7, delay: 0.2 + i * 0.1 }}
                          className={`h-full rounded-full ${tier.bar}`}
                        />
                      </div>
                      <span className={`font-mono text-[11px] font-bold w-16 text-right flex-shrink-0 ${tier.color}`}>
                        ₹{tier.lpa} LPA
                      </span>
                    </motion.div>
                  ))}
                </div>

                {/* Meta pills */}
                <div className="flex items-center gap-2 flex-wrap mb-3">
                  <div className="flex items-center gap-1 bg-background/40 border border-border/30 rounded-full px-2.5 py-1">
                    <TrendingUp className="w-2.5 h-2.5 text-muted-foreground" />
                    <span className="font-mono text-[9px] text-muted-foreground">Trend:</span>
                    <span className={`font-mono text-[9px] font-bold ${trendColor[data.market_trend] || "text-foreground"}`}>{data.market_trend}</span>
                  </div>
                  <div className="flex items-center gap-1 bg-background/40 border border-border/30 rounded-full px-2.5 py-1">
                    <Sparkles className="w-2.5 h-2.5 text-muted-foreground" />
                    <span className="font-mono text-[9px] text-muted-foreground">Confidence:</span>
                    <span className={`font-mono text-[9px] font-bold ${confidenceColor[data.confidence] || "text-foreground"}`}>{data.confidence}</span>
                  </div>
                </div>

                {/* Top driver */}
                {data.top_driver && (
                  <div className="flex items-center gap-2 bg-emerald-900/20 border border-emerald-500/15 rounded-lg px-3 py-1.5 mb-2">
                    <span className="font-mono text-[9px] text-muted-foreground uppercase">Key Driver:</span>
                    <span className="font-mono text-[10px] text-emerald-300">{data.top_driver}</span>
                  </div>
                )}

                {/* Rationale */}
                <p className="font-sans text-[10px] text-muted-foreground/80 leading-relaxed">{data.rationale}</p>
              </>
            )}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}