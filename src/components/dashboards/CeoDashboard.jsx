import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/lib/ThemeContext";
import {
  LogOut, Crown, BarChart3, TrendingUp, Users, Briefcase,
  Target, UserCheck, Calendar, Award, IndianRupee, ArrowUpRight,
  Download, ChevronDown, ChevronRight
} from "lucide-react";
import { apiClient } from "@/api/client";
import DashboardCard from "@/components/shared/DashboardCard";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, CartesianGrid, Legend
} from "recharts";

const ESDS_LOGO = "/Logo.png";
const COLORS = ["#22d3ee", "#34d399", "#f59e0b", "#f87171", "#818cf8"];

const MONTHLY_HIRING = [
  { month: "Oct", hired: 4, target: 6 },
  { month: "Nov", hired: 7, target: 6 },
  { month: "Dec", hired: 5, target: 8 },
  { month: "Jan", hired: 9, target: 8 },
  { month: "Feb", hired: 6, target: 7 },
  { month: "Mar", hired: 11, target: 10 },
];

const DEPT_DATA = [
  { dept: "Engineering", headcount: 142, open: 8 },
  { dept: "Data & AI", headcount: 38, open: 3 },
  { dept: "Product", headcount: 22, open: 2 },
  { dept: "HR & Admin", headcount: 15, open: 1 },
];

const HIRING_COST_DATA = {
  Week:    { costPerHire: "₹4,200",  costTrend: "-3% vs last week",  savings: "₹58K",  savingsPeriod: "This week",    timeToHire: "4 days",  timeTrend: "-1 day vs avg",  qualityScore: "8.1/10" },
  Month:   { costPerHire: "₹18,500", costTrend: "-12% vs last month", savings: "₹82K",  savingsPeriod: "This month",   timeToHire: "18 days", timeTrend: "-4 days vs avg", qualityScore: "8.4/10" },
  Quarter: { costPerHire: "₹18,500", costTrend: "-12% vs last Q",    savings: "₹2.4L", savingsPeriod: "This quarter", timeToHire: "18 days", timeTrend: "-4 days vs avg", qualityScore: "8.4/10" },
  Yearly:  { costPerHire: "₹21,000", costTrend: "+5% vs last year",  savings: "₹9.6L", savingsPeriod: "This year",    timeToHire: "20 days", timeTrend: "-2 days vs avg", qualityScore: "8.7/10" },
};

export default function CeoDashboard({ onLogout, position = "CEO" }) {
  const { theme } = useTheme();
  const [stats, setStats] = useState({
    totalJobs: 0,
    totalApplicants: 0,
    shortlisted: 0,
    interviews: 0,
    rejected: 0,
    underReview: 0,
    avgScore: 0,
    allCandidates: [],
    jobs: [],
  });
  const [loadingStats, setLoadingStats] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [costFilter, setCostFilter] = useState("Quarter");
  const [barRoleFilter, setBarRoleFilter] = useState("All");
  const [pieStatusFilter, setPieStatusFilter] = useState("All");
  const [showBarRoleDropdown, setShowBarRoleDropdown] = useState(false);
  const [showPieStatusDropdown, setShowPieStatusDropdown] = useState(false);
  const [barPeriodFilter, setBarPeriodFilter] = useState("all");
  const [showBarPeriodDropdown, setShowBarPeriodDropdown] = useState(false);
  const [topCandidatesPeriodFilter, setTopCandidatesPeriodFilter] = useState("all");
  const [showTopCandidatesPeriodDropdown, setShowTopCandidatesPeriodDropdown] = useState(false);
  const [workforcePeriodFilter, setWorkforcePeriodFilter] = useState("all");
  const [showWorkforcePeriodDropdown, setShowWorkforcePeriodDropdown] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoadingStats(true);
        const { stats: liveStats } = await apiClient.executive.getOverview();
        if (!mounted) return;
        if (liveStats && typeof liveStats === "object") {
          setStats({
            totalJobs: Number(liveStats.totalJobs || 0),
            totalApplicants: Number(liveStats.totalApplicants || 0),
            shortlisted: Number(liveStats.shortlisted || 0),
            interviews: Number(liveStats.interviews || 0),
            rejected: Number(liveStats.rejected || 0),
            underReview: Number(liveStats.underReview || 0),
            avgScore: Number(liveStats.avgScore || 0),
            allCandidates: Array.isArray(liveStats.allCandidates) ? liveStats.allCandidates : [],
            jobs: Array.isArray(liveStats.jobs) ? liveStats.jobs : [],
          });
        }
      } catch (error) {
        console.error("Failed to load executive overview:", error);
      } finally {
        if (mounted) setLoadingStats(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const statusData = [
    { name: "Applied", value: stats.totalApplicants - stats.shortlisted - stats.interviews - stats.underReview - stats.rejected },
    { name: "Under Review", value: stats.underReview },
    { name: "Shortlisted", value: stats.shortlisted },
    { name: "Interview", value: stats.interviews },
    { name: "Rejected", value: stats.rejected },
  ].filter(d => d.value > 0);

  const allJobFunnelData = stats.jobs.map(j => ({
    name: j.title.split(" ").slice(0, 2).join(" "),
    fullTitle: j.title,
    Applied: j.applicants,
    Shortlisted: j.shortlisted,
    Interviews: j.interviews,
  }));

  const jobFunnelData = barRoleFilter === "All" ? allJobFunnelData : allJobFunnelData.filter(j => j.fullTitle === barRoleFilter);

  const allPieStatusData = statusData;
  const filteredPieStatusData = pieStatusFilter === "All" ? allPieStatusData : allPieStatusData.filter(d => d.name === pieStatusFilter);

  const hiringGoalPct = Math.round((stats.shortlisted / Math.max(stats.totalApplicants, 1)) * 100);

  if (loadingStats) {
    return (
      <div className="fixed inset-0 bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[1000] bg-background overflow-y-auto">
      <div className="fixed inset-0 opacity-[0.03] pointer-events-none"
        style={{ backgroundImage: "linear-gradient(hsl(190,90%,50%) 1px, transparent 1px), linear-gradient(90deg, hsl(190,90%,50%) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />

      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/90 backdrop-blur border-b border-border/40 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src={ESDS_LOGO} alt="ESDS" className="w-14 h-14 object-contain" />
          <div>
            <div className="font-bold text-sm text-foreground">{position === "CHRO" ? "Komal Somani" : "Piyush Somani"}</div>
            <div className={`font-mono text-[10px] uppercase tracking-wider font-bold ${theme === 'light' ? 'text-[#003d82]' : 'text-cyan-400'}`}>{position} · eNlight Talent</div>
          </div>
        </div>
        <button onClick={onLogout} className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground text-xs font-mono transition-colors">
          <LogOut className="w-4 h-4" /> Logout
        </button>
      </div>

      <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8">
        {/* KPI Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4 lg:gap-6 mb-6 sm:mb-8">
          {[
            { icon: Briefcase, value: stats.totalJobs, label: "OPEN POSITIONS", subtitle: "In this month", color: "darkBlue" },
            { icon: Users, value: stats.totalApplicants, label: "TOTAL TALENT POOL", subtitle: "In this cycle", color: "darkBlue" },
            { icon: Target, value: `${Math.round((stats.shortlisted / Math.max(stats.totalApplicants,1))*100)}%`, label: "SHORTLIST RATE", subtitle: "Above benchmark", color: "darkBlue" },
            { icon: Award, value: `${stats.avgScore}%`, label: "AVG AI MATCH", subtitle: "Quality pipeline", color: "darkBlue" },
          ].map((s, i) => {
            const colorMap = {
              cyan: { bg: 'bg-cyan-50', icon: 'text-cyan-600' },
              purple: { bg: 'bg-purple-50', icon: 'text-purple-600' },
              green: { bg: 'bg-green-50', icon: 'text-green-600' },
              orange: { bg: 'bg-orange-50', icon: 'text-orange-600' },
              darkBlue: { bg: theme === 'dark' ? 'bg-blue-900/30' : 'bg-blue-50', icon: theme === 'dark' ? 'text-blue-400' : 'text-blue-700', border: 'border-cyan-500' },
            };
            const colors = colorMap[s.color];
            return (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
              className={`rounded-xl p-6 ${colors.bg} border-2`}
              style={{ borderColor: s.color === 'darkBlue' ? '#06b6d4' : colors.bg.replace('bg-', '').split('-')[0] === 'cyan' ? '#06b6d4' : colors.bg.replace('bg-', '').split('-')[0] === 'purple' ? '#a855f7' : colors.bg.replace('bg-', '').split('-')[0] === 'green' ? '#10b981' : '#f97316' }}>
                <s.icon className={`w-5 h-5 ${colors.icon} mb-3`} />
                <div className={`text-3xl font-bold mb-1 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>{s.value}</div>
                <div className={`text-xs font-mono uppercase tracking-wider font-semibold ${theme === 'light' ? 'text-gray-700' : 'text-white'}`}>{s.label}</div>
                <div className={`text-xs mt-1 ${theme === 'light' ? 'text-gray-500' : 'text-gray-300'}`}>{s.subtitle}</div>
              </motion.div>
            );
          })}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-4 sm:mb-6 bg-card/40 border border-border/30 rounded-xl p-1 w-full sm:w-fit overflow-x-auto">
          {["overview", "analytics", "hiring cost"].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded-lg text-xs font-mono uppercase tracking-wider transition-all ${activeTab === tab ? "bg-blue-900 text-white" : "text-muted-foreground hover:text-foreground"}`}>
              {tab}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
              {/* Monthly Hiring Trend */}
              <div className={`bg-card/50 rounded-xl p-5 ${theme === 'dark' ? 'border-2 border-white/30' : 'border-2 border-blue-900/40'}`}>
                <h3 className="font-semibold text-sm text-foreground mb-4 flex items-center gap-2">
                  <TrendingUp className={`w-4 h-4 ${theme === 'dark' ? 'text-white' : 'text-amber-700'}`} /> Monthly Hiring vs Target
                </h3>
                <ResponsiveContainer width="100%" height={160}>
                  <AreaChart data={MONTHLY_HIRING}>
                    <defs>
                      <linearGradient id="hiredGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(214,30%,18%)" />
                    <XAxis dataKey="month" tick={{ fontSize: 10, fill: "hsl(210,20%,60%)" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: "hsl(210,20%,60%)" }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: "hsl(214,50%,8%)", border: "1px solid hsl(214,30%,18%)", borderRadius: 8, fontSize: 11 }} />
                    <Area type="monotone" dataKey="hired" stroke="#22d3ee" fill="url(#hiredGrad)" strokeWidth={2} name="Hired" />
                    <Area type="monotone" dataKey="target" stroke="#8B6F47" fill="none" strokeWidth={2} strokeDasharray="4 4" name="Target" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Status Pie */}
              <div className={`bg-card/50 rounded-xl p-5 ${theme === 'dark' ? 'border-2 border-white/30' : 'border-2 border-blue-900/40'}`}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-sm text-foreground flex items-center gap-2">
                    <Users className={`w-4 h-4 ${theme === 'dark' ? 'text-white' : 'text-amber-400'}`} /> Live Pipeline Status
                  </h3>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <button onClick={() => setShowPieStatusDropdown(v => !v)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-border/40 text-[10px] font-mono text-muted-foreground hover:border-amber-700/40 transition-all">
                        {pieStatusFilter}
                        <ChevronDown className="w-3 h-3" />
                      </button>
                      <AnimatePresence>
                        {showPieStatusDropdown && (
                          <>
                            <div className="fixed inset-0 z-10" onClick={() => setShowPieStatusDropdown(false)} />
                            <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                              className="absolute right-0 top-full mt-1 bg-card border border-border rounded-xl overflow-hidden shadow-xl z-20 w-40">
                              {["All", ...allPieStatusData.map(d => d.name)].map(opt => (
                                <button key={opt} onClick={() => { setPieStatusFilter(opt); setShowPieStatusDropdown(false); }}
                                  className={`w-full text-left px-3 py-2 font-mono text-[10px] transition-colors hover:bg-muted/30 border-b border-border/20 last:border-b-0 ${pieStatusFilter === opt ? "text-amber-700 bg-amber-700/10" : "text-muted-foreground"}`}>
                                  {opt}
                                </button>
                              ))}
                            </motion.div>
                          </>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <ResponsiveContainer width="55%" height={160}>
                    <PieChart>
                      <Pie data={filteredPieStatusData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={3} dataKey="value">
                        {filteredPieStatusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={{ background: "hsl(214,50%,8%)", border: "1px solid hsl(214,30%,18%)", borderRadius: 8, fontSize: 11 }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-2 flex-1">
                    {filteredPieStatusData.map((d, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                        <span className="font-mono text-[10px] text-muted-foreground flex-1">{d.name}</span>
                        <span className="font-mono text-[10px] font-bold text-foreground">{d.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === "analytics" && (
          <div className="space-y-4 sm:space-y-6">
            {/* Export Button */}
            <div className="flex justify-end overflow-x-auto pb-2">
              <div className="flex gap-1 sm:gap-2 flex-wrap sm:flex-nowrap">
                <button
                  onClick={() => {
                    const rows = [
                      ["Metric", "Value"],
                      ["Open Positions", stats.totalJobs],
                      ["Total Talent Pool", stats.totalApplicants],
                      ["Shortlisted", stats.shortlisted],
                      ["Interviews", stats.interviews],
                      ["Rejected", stats.rejected],
                      ["Avg AI Score", `${stats.avgScore}%`],
                      ["Shortlist Rate", `${Math.round((stats.shortlisted / Math.max(stats.totalApplicants,1))*100)}%`],
                      ["Interview Rate", `${Math.round((stats.interviews / Math.max(stats.totalApplicants,1))*100)}%`],
                      ["Rejection Rate", `${Math.round((stats.rejected / Math.max(stats.totalApplicants,1))*100)}%`],
                      ["Offer Acceptance", "92%"],
                      ["Time-to-Shortlist", "3.2 days"],
                      [],
                      ["Top Candidates by AI Score"],
                      ["Name", "Role", "Score"],
                      ...stats.allCandidates.sort((a,b) => b.score - a.score).slice(0,5).map(c => [c.name, c.jobTitle, `${c.score}%`]),
                      [],
                      ["Hiring Funnel by Role"],
                      ["Role", "Applied", "Shortlisted", "Interviews"],
                      ...stats.jobs.map(j => [j.title, j.applicants, j.shortlisted, j.interviews]),
                    ];
                    const csv = rows.map(r => r.map(v => `"${v ?? ""}"`).join(",")).join("\n");
                    const blob = new Blob([csv], { type: "text/csv" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a"); a.href = url;
                    a.download = `eNlight_CEO_Analytics_Report.csv`;
                    a.click(); URL.revokeObjectURL(url);
                  }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-xs font-mono transition-all ${theme === 'light' ? 'border-green-700 text-green-700 hover:bg-green-700/10' : 'border-green-500/40 text-green-400 hover:bg-green-500/10'}`}
                >
                  <TrendingUp className="w-3.5 h-3.5" /> Export CSV
                </button>
                <button
                  onClick={() => {
                    const content = `
ESDS eNlight Talent Platform — CEO Analytics Report
Generated: ${new Date().toLocaleDateString("en-IN", { dateStyle: "long" })}
${"=".repeat(55)}

KEY METRICS
-----------
Open Positions       : ${stats.totalJobs}
Total Talent Pool    : ${stats.totalApplicants}
Shortlisted          : ${stats.shortlisted}
Interviews           : ${stats.interviews}
Rejected             : ${stats.rejected}
Avg AI Score         : ${stats.avgScore}%
Shortlist Rate       : ${Math.round((stats.shortlisted / Math.max(stats.totalApplicants,1))*100)}%
Interview Rate       : ${Math.round((stats.interviews / Math.max(stats.totalApplicants,1))*100)}%
Offer Acceptance     : 92%
Time-to-Shortlist    : 3.2 days

TOP CANDIDATES (by AI Score)
-----------------------------
${stats.allCandidates.sort((a,b) => b.score - a.score).slice(0,5).map((c,i) => `${i+1}. ${c.name.padEnd(20)} ${c.jobTitle.split(" ").slice(0,3).join(" ").padEnd(25)} ${c.score}%`).join("\n")}

HIRING FUNNEL BY ROLE
----------------------
${stats.jobs.map(j => `${j.title.padEnd(30)} Applied: ${String(j.applicants).padEnd(4)} Shortlisted: ${String(j.shortlisted).padEnd(4)} Interviews: ${j.interviews}`).join("\n")}

${"=".repeat(55)}
Powered by eNlight AI · ESDS Software Solutions
                    `.trim();
                    const blob = new Blob([content], { type: "text/plain" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a"); a.href = url;
                    a.download = `eNlight_CEO_Analytics_Report.txt`;
                    a.click(); URL.revokeObjectURL(url);
                  }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-xs font-mono transition-all ${theme === 'light' ? 'border-amber-700 text-amber-700 hover:bg-amber-700/10' : 'border-amber-500/40 text-amber-400 hover:bg-amber-500/10'}`}
                >
                  <Award className="w-3.5 h-3.5" /> Export Report
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
              {/* Bar Chart - Jobs */}
              <div className={`bg-card/50 rounded-xl p-5 border-2 ${theme === 'dark' ? 'border-white/30' : 'border-blue-900/40'}`}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-sm text-foreground flex items-center gap-2">
                    <BarChart3 className={`w-4 h-4 ${theme === 'dark' ? 'text-white' : 'text-amber-700'}`} /> Hiring Funnel by Role
                  </h3>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <button onClick={() => setShowBarRoleDropdown(v => !v)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-border/40 text-[10px] font-mono text-muted-foreground hover:border-amber-700/40 transition-all">
                        {barRoleFilter === "All" ? "All Roles" : barRoleFilter.split(" ").slice(0,2).join(" ")}
                        <ChevronDown className="w-3 h-3" />
                      </button>
                      <AnimatePresence>
                        {showBarRoleDropdown && (
                          <>
                            <div className="fixed inset-0 z-10" onClick={() => setShowBarRoleDropdown(false)} />
                            <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                              className="absolute right-0 top-full mt-1 bg-card border border-border rounded-xl overflow-hidden shadow-xl z-20 w-44">
                              {["All", ...stats.jobs.map(j => j.title)].map(opt => (
                                <button key={opt} onClick={() => { setBarRoleFilter(opt); setShowBarRoleDropdown(false); }}
                                  className={`w-full text-left px-3 py-2 font-mono text-[10px] transition-colors hover:bg-muted/30 border-b border-border/20 last:border-b-0 ${barRoleFilter === opt ? "text-amber-700 bg-amber-700/10" : "text-muted-foreground"}`}>
                                  {opt === "All" ? "All Roles" : opt}
                                </button>
                              ))}
                            </motion.div>
                          </>
                        )}
                      </AnimatePresence>
                    </div>
                    {/* Bar Period Dropdown */}
                    <div className="relative">
                      <button onClick={() => setShowBarPeriodDropdown(v => !v)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-border/40 text-[10px] font-mono text-muted-foreground hover:border-amber-700/40 transition-all">
                        {barPeriodFilter === "all" ? "All Time" : 
                         barPeriodFilter === "weekly" ? "Weekly" :
                         barPeriodFilter === "monthly" ? "Monthly" :
                         barPeriodFilter === "quarterly" ? "Quarterly" :
                         barPeriodFilter === "half-year" ? "Half Year" : "Yearly"}
                        <ChevronDown className="w-3 h-3" />
                      </button>
                      <AnimatePresence>
                        {showBarPeriodDropdown && (
                          <>
                            <div className="fixed inset-0 z-10" onClick={() => setShowBarPeriodDropdown(false)} />
                            <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                              className="absolute right-0 top-full mt-1 bg-card border border-border rounded-xl overflow-hidden shadow-xl z-20 w-48">
                              {[
                                { value: "all", label: "All Time" },
                                { value: "weekly", label: "Weekly" },
                                { value: "monthly", label: "Monthly" },
                                { value: "quarterly", label: "Quarterly" },
                                { value: "half-year", label: "Half Year" },
                                { value: "yearly", label: "Yearly" },
                              ].map(opt => (
                                <button key={opt.value} onClick={() => { setBarPeriodFilter(opt.value); setShowBarPeriodDropdown(false); }}
                                  className={`w-full text-left px-3 py-2 font-mono text-[10px] transition-colors hover:bg-muted/30 border-b border-border/20 last:border-b-0 ${barPeriodFilter === opt.value ? "text-amber-700 bg-amber-700/10" : "text-muted-foreground"}`}>
                                  {opt.label}
                                </button>
                              ))}
                            </motion.div>
                          </>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={jobFunnelData} barSize={12}>
                    <XAxis dataKey="name" tick={{ fontSize: 9, fill: "hsl(210,20%,60%)" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 9, fill: "hsl(210,20%,60%)" }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: "hsl(214,50%,8%)", border: "1px solid hsl(214,30%,18%)", borderRadius: 8, fontSize: 11 }} />
                    <Legend wrapperStyle={{ fontSize: 10 }} />
                    <Bar dataKey="Applied" fill="hsl(190,90%,50%)" radius={[4,4,0,0]} />
                    <Bar dataKey="Shortlisted" fill="#34d399" radius={[4,4,0,0]} />
                    <Bar dataKey="Interviews" fill="#60a5fa" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* AI Score Distribution */}
              <div className={`bg-card/50 rounded-xl p-5 border-2 ${theme === 'dark' ? 'border-white/30' : 'border-blue-900/40'}`}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-sm text-foreground flex items-center gap-2">
                    <Award className={`w-4 h-4 ${theme === 'dark' ? 'text-white' : 'text-amber-700'}`} /> Top Candidates Overview
                  </h3>
                  {/* Top Candidates Period Dropdown */}
                  <div className="relative">
                    <button onClick={() => setShowTopCandidatesPeriodDropdown(v => !v)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-border/40 text-[10px] font-mono text-muted-foreground hover:border-amber-700/40 transition-all">
                      {topCandidatesPeriodFilter === "all" ? "All Time" : 
                       topCandidatesPeriodFilter === "weekly" ? "Weekly" :
                       topCandidatesPeriodFilter === "monthly" ? "Monthly" :
                       topCandidatesPeriodFilter === "quarterly" ? "Quarterly" :
                       topCandidatesPeriodFilter === "half-year" ? "Half Year" : "Yearly"}
                      <ChevronDown className="w-3 h-3" />
                    </button>
                    <AnimatePresence>
                      {showTopCandidatesPeriodDropdown && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setShowTopCandidatesPeriodDropdown(false)} />
                          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                            className="absolute right-0 top-full mt-1 bg-card border border-border rounded-xl overflow-hidden shadow-xl z-20 w-48">
                            {[
                              { value: "all", label: "All Time" },
                              { value: "weekly", label: "Weekly" },
                              { value: "monthly", label: "Monthly" },
                              { value: "quarterly", label: "Quarterly" },
                              { value: "half-year", label: "Half Year" },
                              { value: "yearly", label: "Yearly" },
                            ].map(opt => (
                              <button key={opt.value} onClick={() => { setTopCandidatesPeriodFilter(opt.value); setShowTopCandidatesPeriodDropdown(false); }}
                                className={`w-full text-left px-3 py-2 font-mono text-[10px] transition-colors hover:bg-muted/30 border-b border-border/20 last:border-b-0 ${topCandidatesPeriodFilter === opt.value ? "text-amber-700 bg-amber-700/10" : "text-muted-foreground"}`}>
                                {opt.label}
                              </button>
                            ))}
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
                <div className="space-y-2">
                  {stats.allCandidates.sort((a, b) => b.score - a.score).slice(0, 5).map((c, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center font-bold text-amber-400 text-[10px] flex-shrink-0">{i+1}</div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-xs text-foreground truncate">{c.name}</div>
                        <div className="font-mono text-[9px] text-muted-foreground truncate">{c.jobTitle.split(" ").slice(0,2).join(" ")}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-muted/30 rounded-full overflow-hidden">
                          <div className="h-full rounded-full bg-amber-700" style={{ width: `${c.score}%` }} />
                        </div>
                        <span className="font-mono text-xs font-bold text-amber-700 w-8">{c.score}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Metrics Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Time-to-Shortlist", value: "3.2 days", color: theme === 'dark' ? "text-white" : "text-amber-700", icon: <Calendar className="w-4 h-4" /> },
                { label: "Interview Rate", value: `${Math.round((stats.interviews / Math.max(stats.totalApplicants,1))*100)}%`, color: "text-blue-400", icon: <UserCheck className="w-4 h-4" /> },
                { label: "Rejection Rate", value: `${Math.round((stats.rejected / Math.max(stats.totalApplicants,1))*100)}%`, color: "text-red-400", icon: <Users className="w-4 h-4" /> },
                { label: "Offer Acceptance", value: "92%", color: "text-green-400", icon: <TrendingUp className="w-4 h-4" /> },
              ].map((m, i) => (
                <div key={i} className={`bg-card/50 rounded-xl p-4 flex items-center gap-3 ${theme === 'dark' ? 'border-2 border-white/30' : 'border-2 border-blue-900/40'}`}>
                  <div className={`${m.color}`}>{m.icon}</div>
                  <div>
                    <div className={`font-display text-lg font-bold ${m.color}`}>{m.value}</div>
                    <div className="font-mono text-[9px] text-muted-foreground uppercase">{m.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}



        {/* Hiring Cost Tab */}
        {activeTab === "hiring cost" && (
          <div className="space-y-6">
            {/* Selected Candidates */}
            <div className={`bg-card/50 rounded-xl p-5 ${theme === 'dark' ? 'border-2 border-white/30' : 'border-2 border-blue-900/40'}`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-sm text-foreground flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-green-400" /> Selected Candidates
                </h3>
                <div className="flex items-center gap-2">
                  {/* Period Filter */}
                  <div className="relative">
                    <button onClick={() => setShowWorkforcePeriodDropdown(v => !v)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-border/40 text-[10px] font-mono text-muted-foreground hover:border-green-400/40 transition-all">
                      {workforcePeriodFilter === "all" ? "All Time" : 
                       workforcePeriodFilter === "weekly" ? "Weekly" :
                       workforcePeriodFilter === "monthly" ? "Monthly" :
                       workforcePeriodFilter === "quarterly" ? "Quarterly" :
                       workforcePeriodFilter === "half-year" ? "Half Year" : "Yearly"}
                      <ChevronDown className="w-3 h-3" />
                    </button>
                    <AnimatePresence>
                      {showWorkforcePeriodDropdown && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setShowWorkforcePeriodDropdown(false)} />
                          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                            className="absolute right-0 top-full mt-1 bg-card border border-border rounded-xl overflow-hidden shadow-xl z-20 w-48">
                            {[
                              { value: "all", label: "All Time" },
                              { value: "weekly", label: "Weekly" },
                              { value: "monthly", label: "Monthly" },
                              { value: "quarterly", label: "Quarterly" },
                              { value: "half-year", label: "Half Year" },
                              { value: "yearly", label: "Yearly" },
                            ].map(opt => (
                              <button key={opt.value} onClick={() => { setWorkforcePeriodFilter(opt.value); setShowWorkforcePeriodDropdown(false); }}
                                className={`w-full text-left px-3 py-2 font-mono text-[10px] transition-colors hover:bg-muted/30 border-b border-border/20 last:border-b-0 ${workforcePeriodFilter === opt.value ? "text-green-400 bg-green-400/10" : "text-muted-foreground"}`}>
                                {opt.label}
                              </button>
                            ))}
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </div>
                  {/* Export Button */}
                  <button
                    onClick={() => {
                      const selectedCandidates = stats.allCandidates.filter(c => c.status === "Shortlisted" || c.status === "HR Interview Scheduled");
                      const rows = [
                        ["Sr No.", "Name", "Email ID", "Package (LPA)", "Recruiter ID"],
                        ...selectedCandidates.map((c, i) => [
                          i + 1,
                          c.name,
                          c.recruiterEmail || "—",
                          c.package || "—",
                          c.employeeNumber || "—"
                        ])
                      ];
                      const totalPackage = selectedCandidates.reduce((sum, c) => sum + (parseInt(c.package) || 0), 0);
                      rows.push([]);
                      rows.push(["Total Package", "", "", totalPackage + " LPA", ""]);
                      const csv = rows.map(r => r.map(v => `"${v}"`).join(",")).join("\n");
                      const blob = new Blob([csv], { type: "text/csv" });
                      const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
                      a.download = "selected_candidates.csv"; a.click();
                    }}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-green-500/40 text-green-400 hover:bg-green-500/10 text-[10px] font-mono transition-all">
                    <Download className="w-3 h-3" /> Export
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border/30">
                      {["Sr No.", "Name", "Email ID", "Package (LPA)", "Recruiter ID"].map(h => (
                        <th key={h} className="text-left font-mono text-[10px] text-muted-foreground pb-2 pr-4 uppercase whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {stats.allCandidates.filter(c => c.status === "Shortlisted" || c.status === "HR Interview Scheduled").map((c, i) => (
                      <tr key={i} className="border-b border-border/10 hover:bg-muted/10 transition-colors">
                        <td className="py-2.5 pr-4 font-mono text-[10px] text-muted-foreground">{i + 1}</td>
                        <td className="py-2.5 pr-4 font-semibold text-foreground">{c.name}</td>
                        <td className="py-2.5 pr-4 font-mono text-[10px] text-muted-foreground">{c.recruiterEmail || "—"}</td>
                        <td className={`py-2.5 pr-4 font-mono text-[10px] font-bold ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>{c.package || "—"} LPA</td>
                        <td className="py-2.5 pr-4 font-mono text-[10px] text-primary/70">{c.employeeNumber || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {stats.allCandidates.filter(c => c.status === "Shortlisted" || c.status === "HR Interview Scheduled").length > 0 && (
                  <div className="mt-4 pt-4 border-t border-border/20 flex items-center justify-between">
                    <span className="font-mono text-[10px] text-muted-foreground uppercase">Total Package</span>
                    <div className="text-right">
                      <div className={`font-mono text-sm font-bold ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                        ₹{stats.allCandidates.filter(c => c.status === "Shortlisted" || c.status === "HR Interview Scheduled").reduce((sum, c) => sum + (parseInt(c.package) || 0), 0)} LPA
                      </div>
                      <div className={`font-mono text-[12px] ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                        ({stats.allCandidates.filter(c => c.status === "Shortlisted" || c.status === "HR Interview Scheduled").reduce((sum, c) => sum + (parseInt(c.package) || 0), 0)} Lakh Rupees)
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}