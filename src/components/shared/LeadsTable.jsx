import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Download, CheckCircle2, XCircle, Clock, Users, FileDown, ChevronDown } from "lucide-react";
import { leadStore } from "@/lib/leadStore";
import { useTheme } from "@/lib/ThemeContext";

export default function LeadsTable({ showActions = false }) {
  const { theme } = useTheme();
  const [leads, setLeads] = useState(leadStore.getLeads());
  const [periodFilter, setPeriodFilter] = useState("all");
  const [showPeriodDropdown, setShowPeriodDropdown] = useState(false);

  useEffect(() => {
    const unsub = leadStore.subscribe(() => setLeads([...leadStore.getLeads()]));
    return unsub;
  }, []);

  const getFilteredLeads = () => {
    const now = new Date();
    return leads.filter(l => {
      const leadDate = new Date(l.submittedAt);
      const diffTime = now - leadDate;
      const diffDays = diffTime / (1000 * 60 * 60 * 24);

      switch(periodFilter) {
        case "weekly":
          return diffDays <= 7;
        case "monthly":
          return diffDays <= 30;
        case "quarterly":
          return diffDays <= 90;
        case "half-year":
          return diffDays <= 180;
        case "yearly":
          return diffDays <= 365;
        default:
          return true;
      }
    });
  };

  const filteredLeads = getFilteredLeads();

  const downloadCSV = () => {
    const rows = [
      ["Sr No.", "Candidate Name", "Email ID", "Phone Number", "Location", "Top Match Role", "AI Score", "Submitted At", "Status"],
      ...leads.map((l, i) => [i + 1, l.name, l.email, l.phone || "—", l.location || "—", l.topMatch, `${l.aiScore}%`, l.submittedAt, l.status]),
    ];
    const csv = rows.map(r => r.map(v => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "candidate_leads.csv";
    a.click();
  };

  const statusIcon = (status) => {
    if (status === "accepted") return <CheckCircle2 className="w-4 h-4 text-green-400" />;
    if (status === "rejected") return <XCircle className="w-4 h-4 text-red-400" />;
    return <Clock className="w-4 h-4 text-amber-400" />;
  };

  return (
    <div className={`bg-card/50 rounded-xl p-5 ${theme === 'dark' ? 'border-2 border-white/30' : 'border-2 border-blue-900/40'}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-sm text-foreground flex items-center gap-2">
          <Users className="w-4 h-4 text-primary" /> Candidate Leads
          <span className="font-mono text-[10px] text-muted-foreground bg-muted/30 px-2 py-0.5 rounded-full">{filteredLeads.length}</span>
        </h3>
        <div className="flex items-center gap-3">
          <div className="relative">
            <button
              onClick={() => setShowPeriodDropdown(!showPeriodDropdown)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border/40 text-muted-foreground hover:text-foreground text-xs font-mono transition-all"
            >
              {periodFilter === "all" ? "All Time" : 
               periodFilter === "weekly" ? "Weekly" :
               periodFilter === "monthly" ? "Monthly" :
               periodFilter === "quarterly" ? "Quarterly" :
               periodFilter === "half-year" ? "Half Year" : "Yearly"}
              <ChevronDown className="w-3 h-3" />
            </button>
            {showPeriodDropdown && (
              <>
                <div className="fixed inset-0 z-[10]" onClick={() => setShowPeriodDropdown(false)} />
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="absolute right-0 top-full mt-1 bg-card border border-border rounded-lg overflow-hidden shadow-xl z-[20]"
                >
                  {[
                    { value: "all", label: "All Time" },
                    { value: "weekly", label: "Weekly" },
                    { value: "monthly", label: "Monthly" },
                    { value: "quarterly", label: "Quarterly" },
                    { value: "half-year", label: "Half Year" },
                    { value: "yearly", label: "Yearly" },
                  ].map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => {
                        setPeriodFilter(opt.value);
                        setShowPeriodDropdown(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-xs font-mono transition-colors hover:bg-muted/30 border-b border-border/20 last:border-b-0 ${
                        periodFilter === opt.value ? "bg-muted/20 text-primary" : "text-muted-foreground"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </motion.div>
              </>
            )}
          </div>
          <button
          onClick={downloadCSV}
          disabled={filteredLeads.length === 0}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-mono transition-all disabled:opacity-40 disabled:cursor-not-allowed ${theme === 'light' ? 'border-green-700 text-green-700 hover:bg-green-700/10' : 'border-green-500/40 text-green-400 hover:bg-green-500/10'}`}
        >
          <Download className="w-3.5 h-3.5" /> Export Excel
        </button>
          </div>
        </div>

      {filteredLeads.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground font-mono text-xs">
          No candidate leads yet. Leads appear when candidates upload their resume.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border/30">
                {["Sr No.", "Candidate Name", "Email ID", "Phone Number", "Location", "Top Match Role", "AI Score", "Submitted At", ...(showActions ? ["Action"] : ["Status"])].map(h => (
                  <th key={h} className="text-left font-mono text-[10px] text-muted-foreground pb-2 pr-4 uppercase whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredLeads.map((lead, i) => (
                <motion.tr key={lead.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  className="border-b border-border/10 hover:bg-muted/10 transition-colors">
                  <td className="py-3 pr-4 font-mono text-[10px] text-muted-foreground">{i + 1}</td>
                  <td className="py-3 pr-4 font-semibold text-foreground whitespace-nowrap">{lead.name}</td>
                  <td className="py-3 pr-4 font-mono text-[10px] text-muted-foreground">{lead.email}</td>
                  <td className="py-3 pr-4 font-mono text-[10px] text-muted-foreground">{lead.phone || "—"}</td>
                  <td className="py-3 pr-4 font-mono text-[10px] text-muted-foreground">{lead.location || "—"}</td>
                  <td className="py-3 pr-4 font-mono text-[10px] text-white whitespace-nowrap">{lead.topMatch}</td>
                  <td className={`py-3 pr-4 font-mono text-[10px] font-bold ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>{lead.aiScore}%</td>
                  <td className="py-3 pr-4 font-mono text-[10px] text-muted-foreground whitespace-nowrap">{lead.submittedAt}</td>
                  {showActions ? (
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2 pointer-events-none opacity-50">
                        {lead.resumeUrl && (
                          <a
                            href={lead.resumeUrl}
                            download
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg border border-blue-500/40 hover:bg-blue-500/10 transition-all"
                            title="Download Resume"
                          >
                            <FileDown className="w-4 h-4 text-blue-400" />
                          </a>
                        )}
                        <button
                          disabled
                          onClick={() => leadStore.updateStatus(lead.id, "accepted")}
                          className={`p-1.5 rounded-lg border transition-all ${lead.status === "accepted" ? "bg-green-500/20 border-green-500/40" : "border-border/30 hover:bg-green-500/10 hover:border-green-500/40"}`}
                          title="Accept"
                        >
                          <CheckCircle2 className="w-4 h-4 text-green-400" />
                        </button>
                        <button
                          disabled
                          onClick={() => leadStore.updateStatus(lead.id, "rejected")}
                          className={`p-1.5 rounded-lg border transition-all ${lead.status === "rejected" ? "bg-red-500/20 border-red-500/40" : "border-border/30 hover:bg-red-500/10 hover:border-red-500/40"}`}
                          title="Reject"
                        >
                          <XCircle className="w-4 h-4 text-red-400" />
                        </button>
                      </div>
                    </td>
                  ) : (
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2">
                        {lead.resumeUrl && (
                          <button
                            disabled
                            className="p-1.5 rounded-lg border border-blue-500/40 cursor-not-allowed opacity-50"
                            title="Download Resume"
                          >
                            <FileDown className="w-4 h-4 text-blue-400" />
                          </button>
                        )}
                        <div className="flex items-center gap-1.5">
                          {statusIcon(lead.status)}
                          <span className={`font-mono text-[9px] capitalize ${lead.status === "accepted" ? "text-green-400" : lead.status === "rejected" ? "text-red-400" : "text-amber-400"}`}>
                            {lead.status}
                          </span>
                        </div>
                      </div>
                    </td>
                  )}
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
    );
    }