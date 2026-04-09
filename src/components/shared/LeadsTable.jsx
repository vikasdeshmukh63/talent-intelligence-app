import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Download, CheckCircle2, XCircle, Clock, Users, FileDown, ChevronDown } from "lucide-react";
import { leadStore } from "@/lib/leadStore";
import { useTheme } from "@/lib/ThemeContext";
import { apiClient } from "@/api/client";
import { useAppPopup } from "@/components/shared/AppPopupProvider";

const APP_STATUS_TO_LEAD_STATUS = {
  Applied: "pending",
  "Under Review": "pending",
  Shortlisted: "accepted",
  "HR Interview Scheduled": "accepted",
  Rejected: "rejected",
};

const LEAD_STATUS_TO_APP_STATUS = {
  accepted: "Shortlisted",
  rejected: "Rejected",
};

const parseUserRole = () => {
  try {
    const raw = localStorage.getItem("talent_user");
    if (!raw) return "";
    const user = JSON.parse(raw);
    return user?.role || "";
  } catch {
    return "";
  }
};

const formatDate = (value) => {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return String(value);
  return parsed.toLocaleString("en-IN");
};

const mapRecruiterCandidateToLead = (candidate, jobTitle) => ({
  id: `app-${candidate.id}`,
  applicationId: candidate.id,
  name: candidate.name || "Candidate",
  email: candidate.email || "",
  phone: candidate.phone || "",
  location: candidate.location || "",
  topMatch: jobTitle || "—",
  aiScore: typeof candidate.score === "number" ? candidate.score : 0,
  submittedAt: formatDate(candidate.appliedAt || candidate.updatedAt),
  status: APP_STATUS_TO_LEAD_STATUS[candidate.status] || "pending",
  resumeUrl: candidate.resumeUrl || "",
  source: "api",
});

const mapExecutiveCandidateToLead = (candidate) => ({
  id: `exec-${candidate.id}`,
  applicationId: candidate.id,
  name: candidate.name || "Candidate",
  email: candidate.email || "",
  phone: "",
  location: "",
  topMatch: candidate.jobTitle || "—",
  aiScore: typeof candidate.score === "number" ? candidate.score : 0,
  submittedAt: "—",
  status: APP_STATUS_TO_LEAD_STATUS[candidate.status] || "pending",
  resumeUrl: "",
  source: "api",
});

export default function LeadsTable({ showActions = false }) {
  const { theme } = useTheme();
  const popup = useAppPopup();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [periodFilter, setPeriodFilter] = useState("all");
  const [showPeriodDropdown, setShowPeriodDropdown] = useState(false);

  useEffect(() => {
    const applyMergedLeads = (apiLeads) => {
      const localLeads = leadStore.getLeads().map((lead) => ({
        ...lead,
        source: lead.source || "local",
      }));
      const apiKeys = new Set(
        (apiLeads || []).map((l) => `${(l.email || "").toLowerCase()}|${l.topMatch || ""}`)
      );
      const localOnly = localLeads.filter(
        (l) => !apiKeys.has(`${(l.email || "").toLowerCase()}|${l.topMatch || ""}`)
      );
      const merged = [...(apiLeads || []), ...localOnly];
      setLeads(merged);
    };

    const loadLeads = async () => {
      setLoading(true);
      try {
        const role = parseUserRole();
        if (role === "admin") {
          const { stats } = await apiClient.executive.getOverview();
          const execLeads = (stats?.allCandidates || []).map(mapExecutiveCandidateToLead);
          applyMergedLeads(execLeads);
          return;
        }

        const { jobs } = await apiClient.recruiter.listMyJobs();
        const safeJobs = Array.isArray(jobs) ? jobs : [];
        const appResponses = await Promise.all(
          safeJobs.map((job) =>
            apiClient.recruiter
              .listApplications(job.id)
              .catch(() => ({ candidates: [], job: { title: job.title } }))
          )
        );

        const apiLeads = appResponses.flatMap((response, idx) => {
          const title = response?.job?.title || safeJobs[idx]?.title || "—";
          const candidates = Array.isArray(response?.candidates) ? response.candidates : [];
          return candidates.map((candidate) => mapRecruiterCandidateToLead(candidate, title));
        });

        applyMergedLeads(apiLeads);
      } catch (_error) {
        applyMergedLeads([]);
      } finally {
        setLoading(false);
      }
    };

    loadLeads();
    const unsub = leadStore.subscribe(() => {
      setLeads((current) => {
        const localLeads = leadStore.getLeads().map((lead) => ({
          ...lead,
          source: lead.source || "local",
        }));
        const apiLeads = current.filter((lead) => lead.source === "api");
        const apiKeys = new Set(
          apiLeads.map((l) => `${(l.email || "").toLowerCase()}|${l.topMatch || ""}`)
        );
        const localOnly = localLeads.filter(
          (l) => !apiKeys.has(`${(l.email || "").toLowerCase()}|${l.topMatch || ""}`)
        );
        return [...apiLeads, ...localOnly];
      });
    });
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
  const downloadResume = async (lead) => {
    if (!lead?.resumeUrl) {
      await popup.alert("No resume file was attached by this candidate.");
      return;
    }

    try {
      const token = localStorage.getItem("talent_token");
      const apiBase = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";
      const params = new URLSearchParams({ file_url: lead.resumeUrl });
      const response = await fetch(`${apiBase}/api/uploads/download?${params.toString()}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!response.ok) {
        throw new Error(`Failed to download resume (${response.status})`);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const extensionGuess = lead.resumeUrl.split("?")[0].split(".").pop()?.toLowerCase() || "pdf";
      const safeName = (lead.name || "Candidate").replace(/\s+/g, "_");
      const a = document.createElement("a");
      a.href = url;
      a.download = `${safeName}_Resume.${extensionGuess}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Resume download failed:", error);
      await popup.alert("Could not download resume file. Please try again.");
    }
  };

  const updateLeadStatus = async (lead, status) => {
    if (!LEAD_STATUS_TO_APP_STATUS[status]) return;
    try {
      if (lead.applicationId && lead.source === "api") {
        await apiClient.recruiter.updateApplicationStatus(
          lead.applicationId,
          LEAD_STATUS_TO_APP_STATUS[status]
        );
      }
      leadStore.updateStatus(lead.id, status);
      setLeads((prev) => prev.map((item) => (item.id === lead.id ? { ...item, status } : item)));
    } catch (error) {
      await popup.alert(error?.message || "Failed to update lead status.");
    }
  };


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

      {loading ? (
        <div className="text-center py-12 text-muted-foreground font-mono text-xs">
          Loading candidate leads...
        </div>
      ) : filteredLeads.length === 0 ? (
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
                      <div className="flex items-center gap-2">
                        {lead.resumeUrl && (
                          <button
                            type="button"
                            onClick={() => downloadResume(lead)}
                            className="p-1.5 rounded-lg border border-blue-500/40 hover:bg-blue-500/10 transition-all"
                            title="Download Resume"
                          >
                            <FileDown className="w-4 h-4 text-blue-400" />
                          </button>
                        )}
                        <button
                          onClick={() => updateLeadStatus(lead, "accepted")}
                          className={`p-1.5 rounded-lg border transition-all ${lead.status === "accepted" ? "bg-green-500/20 border-green-500/40" : "border-border/30 hover:bg-green-500/10 hover:border-green-500/40"}`}
                          title="Accept"
                        >
                          <CheckCircle2 className="w-4 h-4 text-green-400" />
                        </button>
                        <button
                          onClick={() => updateLeadStatus(lead, "rejected")}
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