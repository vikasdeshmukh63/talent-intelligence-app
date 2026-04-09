import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/lib/ThemeContext";
import {
  LogOut, Users, Briefcase, UserCheck, Calendar, BarChart3,
  ShieldCheck, Activity, FileText, TrendingUp, AlertCircle, CheckCircle2,
  Download, ChevronDown
} from "lucide-react";
import { store } from "@/lib/dashboardStore";
import LeadsTable from "@/components/shared/LeadsTable";
import StatCard from "@/components/shared/StatCard";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid } from "recharts";

const ESDS_LOGO = "/vite.svg";

const COLORS = ["#22d3ee", "#34d399", "#f59e0b", "#f87171", "#818cf8"];

export default function AdminDashboard({ onLogout }) {
  const { theme } = useTheme();
  const [stats, setStats] = useState(store.getStats());
  const [activeTab, setActiveTab] = useState("overview");
  const [barFilter, setBarFilter] = useState("All");
  const [pieFilter, setPieFilter] = useState("All");
  const [showBarDropdown, setShowBarDropdown] = useState(false);
  const [showPieDropdown, setShowPieDropdown] = useState(false);
  const [barPeriodFilter, setBarPeriodFilter] = useState("all");
  const [piePeriodFilter, setPiePeriodFilter] = useState("all");
  const [showBarPeriodDropdown, setShowBarPeriodDropdown] = useState(false);
  const [showPiePeriodDropdown, setShowPiePeriodDropdown] = useState(false);
  const [leadTypeFilter, setLeadTypeFilter] = useState("All");
  const [showLeadTypeDropdown, setShowLeadTypeDropdown] = useState(false);
  const [periodFilter, setPeriodFilter] = useState("all");
  const [showPeriodDropdown, setShowPeriodDropdown] = useState(false);

  useEffect(() => {
    const unsub = store.subscribe(() => setStats(store.getStats()));
    return unsub;
  }, []);

  const allJobBarData = stats.jobs.map(j => ({
    name: j.title.split(" ").slice(0, 2).join(" "),
    fullTitle: j.title,
    Applicants: j.applicants,
    Shortlisted: j.shortlisted,
    Interviews: j.interviews,
  }));

  const jobBarData = barFilter === "All" ? allJobBarData : allJobBarData.filter(j => j.fullTitle === barFilter);

  const allStatusData = [
    { name: "Applied", value: stats.totalApplicants - stats.shortlisted - stats.interviews - stats.underReview - stats.rejected },
    { name: "Under Review", value: stats.underReview },
    { name: "Shortlisted", value: stats.shortlisted },
    { name: "Interview", value: stats.interviews },
    { name: "Rejected", value: stats.rejected },
  ].filter(d => d.value > 0);

  const filteredStatusData = pieFilter === "All" ? allStatusData : allStatusData.filter(d => d.name === pieFilter);
  const statusData = allStatusData;

  const activityLog = [
    { time: "10:32 AM", action: "New candidate applied for Senior React Developer", user: "System", type: "info" },
    { time: "10:15 AM", action: "Ananya Singh moved to HR Interview Scheduled", user: "Priya Mehta", type: "success" },
    { time: "09:50 AM", action: "New JD posted: Data Scientist", user: "Priya Mehta", type: "info" },
    { time: "09:30 AM", action: "Arjun Kapoor shortlisted for Senior React Developer", user: "Priya Mehta", type: "success" },
    { time: "Yesterday", action: "3 new applications received", user: "System", type: "info" },
  ];

  const systemHealth = [
    { label: "API Response", value: "99.9% uptime", status: "ok" },
    { label: "AI Engine", value: "Operational", status: "ok" },
    { label: "Email Service", value: "Operational", status: "ok" },
    { label: "Storage", value: "62% used", status: "warn" },
  ];

  return (
    <div className="fixed inset-0 z-[1000] bg-background overflow-y-auto">
      <div className="fixed inset-0 opacity-[0.03] pointer-events-none"
        style={{ backgroundImage: "linear-gradient(hsl(190,90%,50%) 1px, transparent 1px), linear-gradient(90deg, hsl(190,90%,50%) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />

      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/90 backdrop-blur border-b border-border/40 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src={ESDS_LOGO} alt="ESDS" className="w-14 h-14 object-contain" />
          <div>
            <div className="font-semibold text-sm text-foreground font-bold">Anita Desai</div>
            <div className="font-mono text-[10px] text-primary/70 uppercase tracking-wider font-bold">Admin · eNlight Talent</div>
          </div>
        </div>
        <button onClick={onLogout} className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground text-xs font-mono transition-colors">
          <LogOut className="w-4 h-4" /> Logout
        </button>
      </div>

      <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4 mb-6 sm:mb-8">
          <StatCard icon={Briefcase} label="Active Positions" value={stats.totalJobs} subtitle="In this month" color="cyan" />
          <StatCard icon={Users} label="Total Candidates" value={stats.totalApplicants} subtitle="In this cycle" color="purple" />
          <StatCard icon={UserCheck} label="Shortlisted" value={stats.shortlisted} subtitle="Above benchmark" color="green" />
          <StatCard icon={Activity} label="Avg AI Score" value={`${stats.avgScore}%`} subtitle="Quality pipeline" color="orange" />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-4 sm:mb-6 bg-card/40 border border-border/30 rounded-xl p-1 w-full sm:w-fit overflow-x-auto">
          {["overview", "analytics", "leads"].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded-lg text-xs font-mono uppercase tracking-wider transition-all ${activeTab === tab ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
              {tab}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
            {/* Job Summary */}
            <div className={`bg-card/50 rounded-xl p-5 ${theme === 'dark' ? 'border-2 border-white/30' : 'border-2 border-blue-900/40'}`}>
              <h3 className="font-semibold text-sm text-foreground mb-4 flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-primary" /> Active Positions
              </h3>
              <div className="space-y-3">
                {stats.jobs.map((job, i) => (
                  <div key={i} className="flex items-center justify-between border-b border-border/20 pb-3 last:border-0 last:pb-0">
                    <div>
                      <div className="font-semibold text-xs text-foreground">{job.title}</div>
                      <div className="font-mono text-[9px] text-muted-foreground mt-0.5">Posted {job.posted}</div>
                    </div>
                    <div className="flex gap-4">
                      <div className="text-center">
                        <div className="font-bold text-xs text-foreground">{job.applicants}</div>
                        <div className="font-mono text-[8px] text-muted-foreground">Applied</div>
                      </div>
                      <div className="text-center">
                        <div className="font-bold text-xs text-green-400">{job.shortlisted}</div>
                        <div className="font-mono text-[8px] text-muted-foreground">Listed</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Activity Log */}
            <div className={`bg-card/50 rounded-xl p-5 ${theme === 'dark' ? 'border-2 border-white/30' : 'border-2 border-blue-900/40'}`}>
              <h3 className="font-semibold text-sm text-foreground mb-4 flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary" /> Recent Activity
              </h3>
              <div className="space-y-3">
                {activityLog.map((log, i) => (
                  <div key={i} className="flex gap-3 items-start">
                    <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${log.type === "success" ? "bg-green-400" : "bg-primary/60"}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-foreground">{log.action}</p>
                      <div className="flex gap-2 mt-0.5">
                        <span className="font-mono text-[9px] text-muted-foreground">{log.time}</span>
                        <span className="font-mono text-[9px] text-primary/60">{log.user}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Candidate Status Breakdown */}
            <div className={`bg-card/50 rounded-xl p-5 ${theme === 'dark' ? 'border-2 border-white/30' : 'border-2 border-blue-900/40'}`}>
              <h3 className="font-semibold text-sm text-foreground mb-4 flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" /> Candidate Pipeline
              </h3>
              {[
                { label: "Applied", count: stats.totalApplicants, color: "bg-muted-foreground/40", pct: 100 },
                { label: "Under Review", count: stats.underReview, color: "bg-amber-400/60", pct: Math.round((stats.underReview / Math.max(stats.totalApplicants, 1)) * 100) },
                { label: "Shortlisted", count: stats.shortlisted, color: "bg-green-400/60", pct: Math.round((stats.shortlisted / Math.max(stats.totalApplicants, 1)) * 100) },
                { label: "Interview", count: stats.interviews, color: "bg-blue-400/60", pct: Math.round((stats.interviews / Math.max(stats.totalApplicants, 1)) * 100) },
                { label: "Rejected", count: stats.rejected, color: "bg-red-400/50", pct: Math.round((stats.rejected / Math.max(stats.totalApplicants, 1)) * 100) },
              ].map((f, i) => (
                <div key={i} className="flex items-center gap-3 mb-2">
                  <div className="w-20 font-mono text-[10px] text-muted-foreground text-right">{f.label}</div>
                  <div className={`flex-1 h-4 bg-muted/20 rounded overflow-hidden ${theme === 'light' ? 'border-2 border-black' : ''}`}>
                    <motion.div initial={{ width: 0 }} animate={{ width: `${f.pct}%` }} transition={{ duration: 0.6, delay: i * 0.1 }}
                      className={`h-full ${f.color} rounded`} />
                  </div>
                  <span className="font-mono text-[10px] font-bold text-foreground w-4">{f.count}</span>
                </div>
              ))}
            </div>

            {/* Users */}
            <div className={`bg-card/50 rounded-xl p-5 ${theme === 'dark' ? 'border-2 border-white/30' : 'border-2 border-blue-900/40'}`}>
              <h3 className="font-semibold text-sm text-foreground mb-4 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-primary" /> System Users
              </h3>
              {[
                { name: "Priya Mehta", role: "Recruiter", status: "Active", actions: "42 this week" },
                { name: "Anita Desai", role: "Admin", status: "Active", actions: "18 this week" },
                { name: "Rajiv Sharma", role: "CEO/CHRO", status: "Active", actions: "7 this week" },
              ].map((u, i) => (
                <div key={i} className="flex items-center justify-between py-2.5 border-b border-border/20 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-xs">{u.name[0]}</div>
                    <div>
                      <div className="font-semibold text-xs text-foreground">{u.name}</div>
                      <div className="font-mono text-[9px] text-muted-foreground">{u.role}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-[9px] text-green-400">{u.status}</div>
                    <div className="font-mono text-[9px] text-muted-foreground">{u.actions}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Leads Tab */}
        {activeTab === "leads" && (
          <LeadsTable showActions={false} />
        )}

        {/* Analytics Tab */}
        {activeTab === "analytics" && (
          <div className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
              {/* Bar Chart - Jobs */}
              <div className={`bg-card/50 rounded-xl p-5 border-2 ${theme === 'dark' ? 'border-white/30' : 'border-blue-900/40'}`}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-sm text-foreground flex items-center gap-2">
                    <BarChart3 className={`w-4 h-4 ${theme === 'dark' ? 'text-white' : 'text-primary'}`} /> Applicants by Role
                  </h3>
                  <div className="flex items-center gap-2">
                    {/* Bar Dropdown */}
                    <div className="relative">
                      <button onClick={() => setShowBarDropdown(v => !v)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-border/40 text-[10px] font-mono text-muted-foreground hover:border-primary/40 transition-all">
                        {barFilter === "All" ? "All Roles" : barFilter.split(" ").slice(0,2).join(" ")}
                        <ChevronDown className="w-3 h-3" />
                      </button>
                      <AnimatePresence>
                        {showBarDropdown && (
                          <>
                            <div className="fixed inset-0 z-10" onClick={() => setShowBarDropdown(false)} />
                            <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                              className="absolute right-0 top-full mt-1 bg-card border border-border rounded-xl overflow-hidden shadow-xl z-20 w-44">
                              {["All", ...stats.jobs.map(j => j.title)].map(opt => (
                                <button key={opt} onClick={() => { setBarFilter(opt); setShowBarDropdown(false); }}
                                  className={`w-full text-left px-3 py-2 font-mono text-[10px] transition-colors hover:bg-muted/30 border-b border-border/20 last:border-b-0 ${barFilter === opt ? "text-primary bg-primary/10" : "text-muted-foreground"}`}>
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
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-border/40 text-[10px] font-mono text-muted-foreground hover:border-primary/40 transition-all">
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
                                  className={`w-full text-left px-3 py-2 font-mono text-[10px] transition-colors hover:bg-muted/30 border-b border-border/20 last:border-b-0 ${barPeriodFilter === opt.value ? "text-primary bg-primary/10" : "text-muted-foreground"}`}>
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
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={jobBarData} barSize={14}>
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: "hsl(210,20%,60%)" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: "hsl(210,20%,60%)" }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: "hsl(214,50%,8%)", border: "1px solid hsl(214,30%,18%)", borderRadius: 8, fontSize: 11 }} />
                    <Bar dataKey="Applicants" fill="hsl(190,90%,50%)" radius={[4,4,0,0]} />
                    <Bar dataKey="Shortlisted" fill="#34d399" radius={[4,4,0,0]} />
                    <Bar dataKey="Interviews" fill="#60a5fa" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Pie Chart - Status */}
              <div className={`bg-card/50 rounded-xl p-5 border-2 ${theme === 'dark' ? 'border-white/30' : 'border-blue-900/40'}`}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-sm text-foreground flex items-center gap-2">
                    <TrendingUp className={`w-4 h-4 ${theme === 'dark' ? 'text-white' : 'text-primary'}`} /> Status Distribution
                  </h3>
                  <div className="flex items-center gap-2">
                    {/* Pie Dropdown */}
                    <div className="relative">
                      <button onClick={() => setShowPieDropdown(v => !v)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-border/40 text-[10px] font-mono text-muted-foreground hover:border-primary/40 transition-all">
                        {pieFilter}
                        <ChevronDown className="w-3 h-3" />
                      </button>
                      <AnimatePresence>
                        {showPieDropdown && (
                          <>
                            <div className="fixed inset-0 z-10" onClick={() => setShowPieDropdown(false)} />
                            <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                              className="absolute right-0 top-full mt-1 bg-card border border-border rounded-xl overflow-hidden shadow-xl z-20 w-40">
                              {["All", ...allStatusData.map(d => d.name)].map(opt => (
                                <button key={opt} onClick={() => { setPieFilter(opt); setShowPieDropdown(false); }}
                                  className={`w-full text-left px-3 py-2 font-mono text-[10px] transition-colors hover:bg-muted/30 border-b border-border/20 last:border-b-0 ${pieFilter === opt ? "text-primary bg-primary/10" : "text-muted-foreground"}`}>
                                  {opt}
                                </button>
                              ))}
                            </motion.div>
                          </>
                        )}
                      </AnimatePresence>
                    </div>
                    {/* Pie Period Dropdown */}
                    <div className="relative">
                      <button onClick={() => setShowPiePeriodDropdown(v => !v)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-border/40 text-[10px] font-mono text-muted-foreground hover:border-primary/40 transition-all">
                        {piePeriodFilter === "all" ? "All Time" : 
                         piePeriodFilter === "weekly" ? "Weekly" :
                         piePeriodFilter === "monthly" ? "Monthly" :
                         piePeriodFilter === "quarterly" ? "Quarterly" :
                         piePeriodFilter === "half-year" ? "Half Year" : "Yearly"}
                        <ChevronDown className="w-3 h-3" />
                      </button>
                      <AnimatePresence>
                        {showPiePeriodDropdown && (
                          <>
                            <div className="fixed inset-0 z-10" onClick={() => setShowPiePeriodDropdown(false)} />
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
                                <button key={opt.value} onClick={() => { setPiePeriodFilter(opt.value); setShowPiePeriodDropdown(false); }}
                                  className={`w-full text-left px-3 py-2 font-mono text-[10px] transition-colors hover:bg-muted/30 border-b border-border/20 last:border-b-0 ${piePeriodFilter === opt.value ? "text-primary bg-primary/10" : "text-muted-foreground"}`}>
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
                <div className="flex items-center gap-4">
                  <ResponsiveContainer width="55%" height={180}>
                    <PieChart>
                      <Pie data={filteredStatusData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                        {filteredStatusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={{ background: "hsl(214,50%,8%)", border: "1px solid hsl(214,30%,18%)", borderRadius: 8, fontSize: 11 }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-2">
                    {filteredStatusData.map((d, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                        <span className="font-mono text-[10px] text-muted-foreground">{d.name}</span>
                        <span className="font-mono text-[10px] font-bold text-foreground ml-auto">{d.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* All Candidates Table */}
            <div className={`bg-card/50 rounded-xl p-5 ${theme === 'dark' ? 'border-2 border-white/30' : 'border-2 border-blue-900/40'}`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-sm text-foreground flex items-center gap-2">
                  <FileText className={`w-4 h-4 ${theme === 'dark' ? 'text-white' : 'text-primary'}`} /> All Candidates
                </h3>
                <div className="flex items-center gap-2">
                  {/* Lead Type Dropdown */}
                  <div className="relative">
                    <button onClick={() => setShowLeadTypeDropdown(v => !v)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-border/40 text-[10px] font-mono text-muted-foreground hover:border-primary/40 transition-all">
                      {leadTypeFilter}
                      <ChevronDown className="w-3 h-3" />
                    </button>
                    <AnimatePresence>
                      {showLeadTypeDropdown && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setShowLeadTypeDropdown(false)} />
                          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                            className="absolute right-0 top-full mt-1 bg-card border border-border rounded-xl overflow-hidden shadow-xl z-20 w-48">
                            {["All", "Active", "Inactive", "Rejected"].map(opt => (
                              <button key={opt} onClick={() => { setLeadTypeFilter(opt); setShowLeadTypeDropdown(false); }}
                                className={`w-full text-left px-3 py-2 font-mono text-[10px] transition-colors hover:bg-muted/30 border-b border-border/20 last:border-b-0 ${leadTypeFilter === opt ? "text-primary bg-primary/10" : "text-muted-foreground"}`}>
                                {opt}
                              </button>
                            ))}
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </div>
                  {/* Period Dropdown */}
                  <div className="relative">
                    <button onClick={() => setShowPeriodDropdown(v => !v)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-border/40 text-[10px] font-mono text-muted-foreground hover:border-primary/40 transition-all">
                      {periodFilter === "all" ? "All Time" : 
                       periodFilter === "weekly" ? "Weekly" :
                       periodFilter === "monthly" ? "Monthly" :
                       periodFilter === "quarterly" ? "Quarterly" :
                       periodFilter === "half-year" ? "Half Year" : "Yearly"}
                      <ChevronDown className="w-3 h-3" />
                    </button>
                    <AnimatePresence>
                      {showPeriodDropdown && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setShowPeriodDropdown(false)} />
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
                              <button key={opt.value} onClick={() => { setPeriodFilter(opt.value); setShowPeriodDropdown(false); }}
                                className={`w-full text-left px-3 py-2 font-mono text-[10px] transition-colors hover:bg-muted/30 border-b border-border/20 last:border-b-0 ${periodFilter === opt.value ? "text-primary bg-primary/10" : "text-muted-foreground"}`}>
                                {opt.label}
                              </button>
                            ))}
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </div>
                  {/* Export */}
                  <button onClick={() => {
                    const filtered = stats.allCandidates.filter(c => {
                      if (leadTypeFilter === "All") return true;
                      if (leadTypeFilter === "Active") return ["Shortlisted", "Under Review", "HR Interview Scheduled"].includes(c.status);
                      if (leadTypeFilter === "Inactive") return c.status === "Applied";
                      if (leadTypeFilter === "Rejected") return c.status === "Rejected";
                      return true;
                    });
                    const rows = [["Candidate", "Role", "AI Score", "Skills", "HR Emp No.", "Recruiter Mail", "Status"],
                      ...filtered.map(c => [c.name, c.jobTitle, `${c.score}%`, c.skills.join(", "), c.employeeNumber || "—", c.recruiterEmail || "—", c.status])];
                    const csv = rows.map(r => r.map(v => `"${v}"`).join(",")).join("\n");
                    const blob = new Blob([csv], { type: "text/csv" });
                    const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
                    a.download = "candidates_" + leadTypeFilter.toLowerCase() + ".csv"; a.click();
                  }} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-mono transition-all ${theme === 'light' ? 'border-green-700 text-green-700 hover:bg-green-700/10' : 'border-green-500/40 text-green-400 hover:bg-green-500/10'}`}>
                    <Download className="w-3.5 h-3.5" /> Export Excel
                  </button>
                  </div>
                  </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border/30">
                      {["Candidate", "Role", "AI Score", "Skills", "HR Emp No.", "Recruiter Mail", "Status"].map(h => (
                        <th key={h} className="text-left font-mono text-[10px] text-muted-foreground pb-2 pr-4 uppercase">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {stats.allCandidates.filter(c => {
                      // Lead type filter
                      if (leadTypeFilter === "All") { } else if (leadTypeFilter === "Active") {
                        if (!["Shortlisted", "Under Review", "HR Interview Scheduled"].includes(c.status)) return false;
                      } else if (leadTypeFilter === "Inactive") {
                        if (c.status !== "Applied") return false;
                      } else if (leadTypeFilter === "Rejected") {
                        if (c.status !== "Rejected") return false;
                      }
                      
                      // Period filter
                      const now = new Date();
                      const candDate = new Date();
                      const diffTime = now - candDate;
                      const diffDays = diffTime / (1000 * 60 * 60 * 24);
                      
                      switch(periodFilter) {
                        case "weekly": return diffDays <= 7;
                        case "monthly": return diffDays <= 30;
                        case "quarterly": return diffDays <= 90;
                        case "half-year": return diffDays <= 180;
                        case "yearly": return diffDays <= 365;
                        default: return true;
                      }
                    }).map((c, i) => (
                      <tr key={i} className="border-b border-border/10 hover:bg-muted/10 transition-colors">
                        <td className="py-2.5 pr-4 font-semibold text-foreground">{c.name}</td>
                        <td className="py-2.5 pr-4 font-mono text-[10px] text-muted-foreground">{c.jobTitle.split(" ").slice(0,2).join(" ")}</td>
                        <td className="py-2.5 pr-4 font-mono font-bold text-primary">{c.score}%</td>
                        <td className="py-2.5 pr-4">
                          <div className="flex gap-1 flex-wrap">
                            {c.skills.slice(0,2).map(s => (
                              <span key={s} className="font-mono text-[9px] px-1.5 py-0.5 rounded-full border border-primary/20 text-primary/70 bg-primary/5">{s}</span>
                            ))}
                          </div>
                        </td>
                        <td className="py-2.5 pr-4 font-mono text-[10px] text-primary/70">{c.employeeNumber || "—"}</td>
                        <td className="py-2.5 pr-4 font-mono text-[10px] text-muted-foreground">{c.recruiterEmail || "—"}</td>
                        <td className="py-2.5">
                          <span className={`font-mono text-[9px] px-2 py-0.5 rounded-full border ${
                            c.status === "Shortlisted" ? "text-green-400 bg-green-400/10 border-green-400/30" :
                            c.status === "HR Interview Scheduled" ? "text-blue-400 bg-blue-400/10 border-blue-400/30" :
                            c.status === "Under Review" ? "text-amber-400 bg-amber-400/10 border-amber-400/30" :
                            c.status === "Rejected" ? "text-red-400 bg-red-400/10 border-red-400/30" :
                            "text-muted-foreground bg-muted/20 border-border/30"
                          }`}>{c.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}


      </div>
    </div>
  );
}